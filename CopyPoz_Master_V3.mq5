//+------------------------------------------------------------------+
//|                                            CopyPoz_Master_V3.mq5 |
//|                                                   Copyright 2024 |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, CopyPoz V3"
#property link      "https://www.mql5.com"
#property version   "3.00"
#property strict

// Gerekli Kütüphaneler
#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Zmq\Zmq.mqh>

//--- Girdi Parametreleri
input string   ZmqAddress        = "tcp://*:2000"; // ZeroMQ Yayın Adresi (PUB)
input int      BroadcastInterval = 500;            // Yayın Aralığı (ms)
input bool     LogDetailed       = true;           // Detaylı Loglama

//--- Global Değişkenler
Context        *g_context;
Socket         *g_socket;
bool           g_zmqInitialized = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("--- Master EA V3 Başlatılıyor ---");

   // ZeroMQ Başlatma
   if(!InitZmq())
     {
      Print("HATA: ZeroMQ başlatılamadı!");
      return(INIT_FAILED);
     }

   // Timer Başlatma (Periyodik Yayın İçin)
   EventSetMillisecondTimer(BroadcastInterval);
   
   Print("Master EA V3 Başarıyla Başlatıldı. Yayın Adresi: ", ZmqAddress);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   Print("--- Master EA V3 Sonlandırılıyor ---");
   
   EventKillTimer();
   
   // ZeroMQ Temizliği
   if(g_socket != NULL) delete g_socket;
   if(g_context != NULL) delete g_context;
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // Master EA tick üzerinde özel bir işlem yapmaz, olayları OnTradeTransaction ve OnTimer ile yönetir.
  }

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
  {
   if(!g_zmqInitialized) return;
   
   BroadcastAllPositions();
  }

//+------------------------------------------------------------------+
//| Trade Transaction function                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
  {
   if(!g_zmqInitialized) return;

   // Sadece önemli işlem olaylarını filtrele
   if(trans.type == TRADE_TRANSACTION_POSITION ||           // Pozisyon Açma/Değişme (SL/TP dahil)
      trans.type == TRADE_TRANSACTION_DEAL_ADD)             // İşlem Eklendi (Açılış/Kapanış)
     {
      // Anlık olay bildirimi gönder (Opsiyonel, şimdilik Broadcast yeterli olabilir ama hız için eklenebilir)
      // V3'te tam senkronizasyon için Broadcast'e güveniyoruz, ancak anlık tetikleme için
      // burada da Broadcast çağırabiliriz.
      BroadcastAllPositions(); 
     }
  }

//+------------------------------------------------------------------+
//| ZeroMQ Başlatma Yardımcısı                                       |
//+------------------------------------------------------------------+
bool InitZmq()
  {
   ResetLastError();
   
   g_context = new Context();
   if(g_context == NULL) return false;
   
   g_socket = new Socket(g_context, ZMQ_PUB);
   if(g_socket == NULL) return false;
   
   if(!g_socket.bind(ZmqAddress))
     {
      Print("HATA: ZeroMQ Bind Başarısız! Adres: ", ZmqAddress);
      return false;
     }
     
   g_zmqInitialized = true;
   return true;
  }

//+------------------------------------------------------------------+
//| Tüm Pozisyonları Yayınla                                         |
//+------------------------------------------------------------------+
void BroadcastAllPositions()
  {
   int total = PositionsTotal();
   string json = "{\"type\":\"POSITIONS_BROADCAST\",\"timestamp\":" + IntegerToString(GetTickCount()) + ",\"positions\":[";
   
   int count = 0;
   for(int i = 0; i < total; i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
        {
         if(count > 0) json += ",";
         
         // Pozisyon Verilerini Topla
         string symbol = PositionGetString(POSITION_SYMBOL);
         long type = PositionGetInteger(POSITION_TYPE); // 0: BUY, 1: SELL
         double volume = PositionGetDouble(POSITION_VOLUME);
         double price = PositionGetDouble(POSITION_PRICE_OPEN);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         long magic = PositionGetInteger(POSITION_MAGIC);
         string comment = PositionGetString(POSITION_COMMENT);
         double current_price = PositionGetDouble(POSITION_PRICE_CURRENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         
         // JSON Nesnesi Oluştur
         string posJson = StringFormat(
            "{\"ticket\":%I64d,\"symbol\":\"%s\",\"type\":%d,\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"magic\":%d,\"comment\":\"%s\",\"profit\":%.2f}",
            ticket, symbol, type, volume, price, sl, tp, magic, comment, profit
         );
         
         json += posJson;
         count++;
        }
     }
   
   json += "]}";
   
   // ZeroMQ Mesajı Gönder
   ZmqMsg msg(json);
   if(!g_socket.send(msg, true)) // Non-blocking send
     {
      if(LogDetailed) Print("UYARI: Yayın gönderilemedi.");
     }
   else
     {
      // Başarılı gönderim (LogDetailed açıksa logla, yoksa spam yapma)
      // if(LogDetailed) Print("Yayınlandı: ", count, " pozisyon.");
     }
  }
//+------------------------------------------------------------------+
