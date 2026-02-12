//+------------------------------------------------------------------+
//|                                            CopyPoz_Master_V4.mq5 |
//|                                                   Copyright 2024 |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, CopyPoz V4"
#property link      "https://www.mql5.com"
#property version   "4.00"
#property strict

// Gerekli Kütüphaneler
#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Zmq\Zmq.mqh>

//--- Girdi Parametreleri
input string   ZmqAddress        = "tcp://*:2000"; // ZeroMQ Yayın Adresi (PUB)
input int      BroadcastInterval = 500;            // Yayın Aralığı (ms)
input bool     LogDetailed       = true;           // Detaylı Loglama
input bool     EnableWebMonitor  = true;           // Web İzleme Aktif
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/signal.php"; // Web API Adresi
input string   MasterToken       = "MASTER_SECRET_TOKEN_123"; // API Güvenlik Tokenı

//--- Global Değişkenler
Context        *g_context;
Socket         *g_socket;
bool           g_zmqInitialized = false;
ulong          g_lastWebUpdate = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("--- Master EA V4 Başlatılıyor ---");

   // ZeroMQ Başlatma
   if(!InitZmq())
     {
      Print("HATA: ZeroMQ başlatılamadı!");
      return(INIT_FAILED);
     }

   // Timer Başlatma (Periyodik Yayın İçin)
   EventSetMillisecondTimer(BroadcastInterval);
   
   Print("Master EA V4 Başarıyla Başlatıldı. Yayın Adresi: ", ZmqAddress);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   Print("--- Master EA V4 Sonlandırılıyor ---");
   
   EventKillTimer();
   
   // ZeroMQ Temizliği
   if(g_socket != NULL) delete g_socket;
   if(g_context != NULL) delete g_context;
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
      // Anlık olay bildirimi gönder
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
//| Tüm Pozisyonları Yayınla (ZeroMQ + Web)                          |
//+------------------------------------------------------------------+
void BroadcastAllPositions()
  {
   int total = PositionsTotal();
   string zmqJson = "{\"type\":\"POSITIONS_BROADCAST\",\"timestamp\":" + IntegerToString(GetTickCount()) + ",\"positions\":[";
   string webJson = "{\"positions\":[";
   
   int count = 0;
   for(int i = 0; i < total; i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
        {
         if(count > 0) 
           {
            zmqJson += ",";
            webJson += ",";
           }
         
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
         
         zmqJson += posJson;
         webJson += posJson;
         count++;
        }
     }
   
   zmqJson += "]}";
   webJson += "]}";
   
   // 1. ZeroMQ Mesajı Gönder (Hızlı, Clientlar için)
   ZmqMsg msg(zmqJson);
   g_socket.send(msg, true);
   
   // 2. Web API'ye Gönder (İzleme için, daha seyrek)
   if(EnableWebMonitor && (GetTickCount() - g_lastWebUpdate > 2000)) // En fazla 2 saniyede bir gönder
     {
      SendToWeb(webJson);
      g_lastWebUpdate = GetTickCount();
     }
  }

//+------------------------------------------------------------------+
//| Web API'ye Veri Gönder                                           |
//+------------------------------------------------------------------+
void SendToWeb(string json)
  {
   char data[];
   StringToCharArray(json, data, 0, StringLen(json));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + MasterToken;
   
   if(LogDetailed) Print("Web API'ye gönderiliyor: ", WebMonitorUrl);
   if(LogDetailed) Print("JSON: ", json);
   
   int res = WebRequest("POST", WebMonitorUrl, headers, 1000, data, result, resultHeaders);
   
   if(LogDetailed) Print("Web API Yanıt Kodu: ", res);
   
   if(res == 200)
     {
      if(LogDetailed) Print("Web API Başarılı!");
     }
   else
     {
      Print("Web API Hatası! Kod: ", res);
      if(LogDetailed)
        {
         Print("Yanıt Headers: ", resultHeaders);
         Print("Yanıt: ", CharArrayToString(result));
        }
     }
  }
//+------------------------------------------------------------------+
