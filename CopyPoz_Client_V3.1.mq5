//+------------------------------------------------------------------+
//|                                            CopyPoz_Client_V3.mq5 |
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
input string   ZmqAddress        = "tcp://localhost:2000"; // ZeroMQ Yayın Adresi (Master Adresi)
input string   SymbolMapList     = "";                     // Özel Sembol Eşleşmesi (örn: XAUUSD=GOLD;GER30=DAX)
input string   RemoveMasterSuffix= "";                     // Master Sembolünden Silinecek Ek (örn: m)
input string   AddClientSuffix   = "";                     // Client Sembolüne Eklenecek Ek (örn: c)
input double   LotMultiplier     = 1.0;                    // Lot Çarpanı
input int      MagicNumber       = 123456;                 // Client Magic Number
input bool     LogDetailed       = true;                   // Detaylı Loglama

//--- Global Değişkenler
Context        *g_context;
Socket         *g_socket;
bool           g_zmqInitialized = false;
CTrade         g_trade;
ulong          g_lastSyncTime = 0;
string         g_btnBuyName = "BtnCloseAllBuy";
string         g_btnSellName = "BtnCloseAllSell";
string         g_btnPauseName = "BtnPauseCopy";
bool           g_copyEnabled = true;

// Basit JSON Parser Yardımcıları için Struct
struct PositionData
  {
   ulong    masterTicket;
   string   symbol;
   int      type; // 0: BUY, 1: SELL
   double   volume;
   double   price;
   double   sl;
   double   tp;
  };

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("--- Client EA V3 Başlatılıyor ---");

   // Trade Ayarları
   g_trade.SetExpertMagicNumber(MagicNumber);
   g_trade.SetDeviationInPoints(10);
   g_trade.SetTypeFilling(ORDER_FILLING_FOK); // veya RETURN

   // ZeroMQ Başlatma
   if(!InitZmq())
     {
      Print("HATA: ZeroMQ başlatılamadı!");
      return(INIT_FAILED);
     }
     
   // Timer (Sürekli dinleme ve yedek kontrol için)
   EventSetMillisecondTimer(100); 

   // Butonları Oluştur
   CreateButtons();

   Print("Client EA V3 Başarıyla Başlatıldı. Master Adresi: ", ZmqAddress);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   Print("--- Client EA V3 Sonlandırılıyor ---");
   EventKillTimer();
   
   // Butonları Sil
   DeleteButtons();
   
   if(g_socket != NULL) delete g_socket;
   if(g_context != NULL) delete g_context;
  }

//+------------------------------------------------------------------+
//| Chart Event function                                             |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
  {
   if(id == CHARTEVENT_OBJECT_CLICK)
     {
      if(sparam == g_btnBuyName)
        {
         if(MessageBox("Tüm BUY pozisyonlarını kapatmak istiyor musunuz?", "Onay", MB_YESNO|MB_ICONQUESTION) == IDYES)
           {
            CloseAllPositions(POSITION_TYPE_BUY);
            // Buton durumunu resetle
            ObjectSetInteger(0, g_btnBuyName, OBJPROP_STATE, false);
           }
         else
           {
            ObjectSetInteger(0, g_btnBuyName, OBJPROP_STATE, false);
           }
        }
      else if(sparam == g_btnSellName)
        {
         if(MessageBox("Tüm SELL pozisyonlarını kapatmak istiyor musunuz?", "Onay", MB_YESNO|MB_ICONQUESTION) == IDYES)
           {
            CloseAllPositions(POSITION_TYPE_SELL);
            ObjectSetInteger(0, g_btnSellName, OBJPROP_STATE, false);
           }
         else
           {
            ObjectSetInteger(0, g_btnSellName, OBJPROP_STATE, false);
           }
        }
      else if(sparam == g_btnPauseName)
        {
         g_copyEnabled = !g_copyEnabled;
         
         if(g_copyEnabled)
           {
            ObjectSetString(0, g_btnPauseName, OBJPROP_TEXT, "KOPYALAMA: AKTİF");
            ObjectSetInteger(0, g_btnPauseName, OBJPROP_BGCOLOR, clrGreen);
           }
         else
           {
            ObjectSetString(0, g_btnPauseName, OBJPROP_TEXT, "KOPYALAMA: DURDU");
            ObjectSetInteger(0, g_btnPauseName, OBJPROP_BGCOLOR, clrRed);
           }
           
         ObjectSetInteger(0, g_btnPauseName, OBJPROP_STATE, false);
         ChartRedraw(0);
        }
     }
  }

//+------------------------------------------------------------------+
//| Timer function (Ana Döngü)                                       |
//+------------------------------------------------------------------+
void OnTimer()
  {
   if(!g_zmqInitialized) return;
   
   // Gelen mesajları işle
   ProcessZmqMessages();
  }

//+------------------------------------------------------------------+
//| ZeroMQ Başlatma                                                  |
//+------------------------------------------------------------------+
bool InitZmq()
  {
   ResetLastError();
   
   g_context = new Context();
   if(g_context == NULL) return false;
   
   g_socket = new Socket(g_context, ZMQ_SUB);
   if(g_socket == NULL) return false;
   
   // Master'a bağlan
   if(!g_socket.connect(ZmqAddress))
     {
      Print("HATA: Master'a bağlanılamadı! Adres: ", ZmqAddress);
      return false;
     }
     
   // Tüm mesajlara abone ol
   if(!g_socket.subscribe(""))
     {
      Print("HATA: Abonelik başlatılamadı!");
      return false;
     }
     
   g_zmqInitialized = true;
   return true;
  }

//+------------------------------------------------------------------+
//| Gelen Mesajları İşle                                             |
//+------------------------------------------------------------------+
void ProcessZmqMessages()
  {
   ZmqMsg msg;
   // Non-blocking okuma döngüsü
   while(g_socket.recv(msg, true))
     {
      string json = msg.getData();
      
      // Mesaj Tipi Kontrolü
      if(StringFind(json, "POSITIONS_BROADCAST") >= 0)
        {
         SyncPositions(json);
        }
     }
  }

//+------------------------------------------------------------------+
//| Pozisyon Senkronizasyonu                                         |
//+------------------------------------------------------------------+
void SyncPositions(string json)
  {
   // Kopyalama devre dışıysa işlem yapma
   if(!g_copyEnabled) return;

   // 1. Gelen JSON'daki Pozisyonları Parse Et
   PositionData masterPositions[];
   ParsePositions(json, masterPositions);
   
   // 2. Eksik Pozisyonları Aç veya Güncelle
   int masterCount = ArraySize(masterPositions);
   for(int i = 0; i < masterCount; i++)
     {
      PositionData pos = masterPositions[i];
      string localSymbol = GetLocalSymbol(pos.symbol);
      
      // Sembol Kontrolü
      if(!SymbolInfoInteger(localSymbol, SYMBOL_EXIST))
        {
         if(LogDetailed) Print("HATA: Sembol bulunamadı: ", localSymbol, " (Master: ", pos.symbol, ")");
         continue;
        }
        
      // Bu Master Ticket için açık pozisyonumuz var mı?
      ulong localTicket = FindLocalTicket(pos.masterTicket);
      
      if(localTicket == 0)
        {
         // YOK -> Yeni Pozisyon Aç
         OpenPosition(pos, localSymbol);
        }
      else
        {
         // VAR -> Güncelleme Kontrolü (SL/TP)
         UpdatePosition(localTicket, pos);
        }
     }
     
   // 3. Fazla Pozisyonları Kapat (Master'da Kapanmış Olanlar)
   CloseOrphanPositions(masterPositions);
  }

//+------------------------------------------------------------------+
//| Yeni Pozisyon Aç                                                 |
//+------------------------------------------------------------------+
void OpenPosition(PositionData &pos, string symbol)
  {
   double vol = NormalizeVolume(symbol, pos.volume * LotMultiplier);
   double price = SymbolInfoDouble(symbol, pos.type == 0 ? SYMBOL_ASK : SYMBOL_BID);
   
   // Yorum içine Master Ticket'ı gömüyoruz: "CPv3_12345"
   string comment = "CPv3_" + IntegerToString(pos.masterTicket);
   
   ENUM_ORDER_TYPE orderType = (pos.type == 0) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   
   if(g_trade.PositionOpen(symbol, orderType, vol, price, pos.sl, pos.tp, comment))
     {
      if(LogDetailed) Print("AÇILDI: ", symbol, " ", EnumToString(orderType), " MasterTicket:", pos.masterTicket);
     }
   else
     {
      Print("HATA: Pozisyon açılamadı! ", symbol, " Hata:", GetLastError());
     }
  }

//+------------------------------------------------------------------+
//| Pozisyon Güncelle                                                |
//+------------------------------------------------------------------+
void UpdatePosition(ulong localTicket, PositionData &pos)
  {
   if(PositionSelectByTicket(localTicket))
     {
      double currentSL = PositionGetDouble(POSITION_SL);
      double currentTP = PositionGetDouble(POSITION_TP);
      
      // Ufak farkları yoksay (Floating point hatası)
      if(MathAbs(currentSL - pos.sl) > _Point || MathAbs(currentTP - pos.tp) > _Point)
        {
         if(g_trade.PositionModify(localTicket, pos.sl, pos.tp))
           {
            if(LogDetailed) Print("GÜNCELLENDİ: Ticket:", localTicket, " SL:", pos.sl, " TP:", pos.tp);
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| Fazla Pozisyonları Kapat                                         |
//+------------------------------------------------------------------+
void CloseOrphanPositions(PositionData &masterPositions[])
  {
   int total = PositionsTotal();
   // Tersten dön çünkü kapatma işlemi indexleri kaydırır
   for(int i = total - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
        {
         // Sadece bu EA'nın açtığı (Magic Number uyan) pozisyonlara bak
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber)
           {
            string comment = PositionGetString(POSITION_COMMENT);
            // Bizim formatımızda mı? "CPv3_..."
            if(StringFind(comment, "CPv3_") == 0)
              {
               ulong masterTicket = ExtractMasterTicket(comment);
               
               // Bu Master Ticket, gelen güncel listede var mı?
               bool found = false;
               int mCount = ArraySize(masterPositions);
               for(int k = 0; k < mCount; k++)
                 {
                  if(masterPositions[k].masterTicket == masterTicket)
                    {
                     found = true;
                     break;
                    }
                 }
                 
               // Listede yoksa -> Master kapatmış -> Biz de kapat
               if(!found)
                 {
                  if(g_trade.PositionClose(ticket))
                    {
                     if(LogDetailed) Print("KAPATILDI: Master'da bulunamadı. Ticket:", ticket, " MasterTicket:", masterTicket);
                    }
                 }
              }
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| Master Ticket'ı Bul                                              |
//+------------------------------------------------------------------+
ulong FindLocalTicket(ulong masterTicket)
  {
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
        {
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber)
           {
            string comment = PositionGetString(POSITION_COMMENT);
            if(ExtractMasterTicket(comment) == masterTicket)
               return ticket;
           }
        }
     }
   return 0;
  }

//+------------------------------------------------------------------+
//| Yorumdan Master Ticket Çıkar                                     |
//+------------------------------------------------------------------+
ulong ExtractMasterTicket(string comment)
  {
   // Format: "CPv3_12345"
   if(StringFind(comment, "CPv3_") == 0)
     {
      string idStr = StringSubstr(comment, 5); // "CPv3_" uzunluğu 5
      return StringToInteger(idStr);
     }
   return 0;
  }

//+------------------------------------------------------------------+
//| Sembol Eşleştirme                                                |
//+------------------------------------------------------------------+
string GetLocalSymbol(string masterSymbol)
  {
   // 1. Özel Liste Kontrolü
   if(SymbolMapList != "")
     {
      string pairs[];
      StringSplit(SymbolMapList, ';', pairs);
      for(int i = 0; i < ArraySize(pairs); i++)
        {
         string kv[];
         StringSplit(pairs[i], '=', kv);
         if(ArraySize(kv) == 2)
           {
            if(kv[0] == masterSymbol) return kv[1];
           }
        }
     }
     
   // 2. Suffix İşlemleri
   string temp = masterSymbol;
   
   // Suffix Sil
   if(RemoveMasterSuffix != "" && StringFind(temp, RemoveMasterSuffix) > 0)
     {
      // Basit bir replace yapalım (son kısımdaysa)
      int suffixPos = StringLen(temp) - StringLen(RemoveMasterSuffix);
      if(StringSubstr(temp, suffixPos) == RemoveMasterSuffix)
         temp = StringSubstr(temp, 0, suffixPos);
     }
     
   // Suffix Ekle
   if(AddClientSuffix != "")
     {
      temp += AddClientSuffix;
     }
     
   return temp;
  }

//+------------------------------------------------------------------+
//| Lot Normalizasyonu                                               |
//+------------------------------------------------------------------+
double NormalizeVolume(string symbol, double volume)
  {
   double step = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   double min = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double max = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   
   double vol = MathRound(volume / step) * step;
   if(vol < min) vol = min;
   if(vol > max) vol = max;
   return vol;
  }

//+------------------------------------------------------------------+
//| JSON Parse (Basitleştirilmiş)                                    |
//+------------------------------------------------------------------+
void ParsePositions(string json, PositionData &positions[])
  {
   // MQL5'te tam bir JSON parser olmadığı için string manipülasyonu ile
   // "positions" array'ini bulup içindeki objeleri çıkaracağız.
   // NOT: Bu basit bir parserdır, karmaşık/iç içe JSON'larda hata verebilir
   // ancak Master EA'nın ürettiği formata uygundur.
   
   int posStart = StringFind(json, "\"positions\":[");
   if(posStart < 0) return;
   
   string content = StringSubstr(json, posStart + 12); // positions":[ sonrası
   int posEnd = StringFind(content, "]");
   if(posEnd < 0) return;
   
   content = StringSubstr(content, 0, posEnd); // Sadece array içi
   
   if(content == "") return; // Boş array
   
   string objects[];
   // Objeleri ayır "},{"
   StringSplit(content, '}', objects);
   
   for(int i = 0; i < ArraySize(objects); i++)
     {
      string obj = objects[i];
      // Başlangıçtaki , veya { temizle
      int bracePos = StringFind(obj, "{");
      if(bracePos >= 0) obj = StringSubstr(obj, bracePos + 1);
      
      if(obj == "") continue;
      
      // Değerleri Çıkar
      PositionData data;
      data.masterTicket = (ulong)StringToInteger(ExtractJsonValue(obj, "ticket"));
      data.symbol = ExtractJsonString(obj, "symbol");
      data.type = (int)StringToInteger(ExtractJsonValue(obj, "type"));
      data.volume = StringToDouble(ExtractJsonValue(obj, "volume"));
      data.price = StringToDouble(ExtractJsonValue(obj, "price"));
      data.sl = StringToDouble(ExtractJsonValue(obj, "sl"));
      data.tp = StringToDouble(ExtractJsonValue(obj, "tp"));
      
      // Array'e Ekle
      int size = ArraySize(positions);
      ArrayResize(positions, size + 1);
      positions[size] = data;
     }
  }

string ExtractJsonValue(string json, string key)
  {
   string pattern = "\"" + key + "\":";
   int start = StringFind(json, pattern);
   if(start < 0) return "";
   
   start += StringLen(pattern);
   int end = -1;
   
   // Sayısal değer mi String mi?
   // Basitçe bir sonraki , veya } bulana kadar al
   for(int i = start; i < StringLen(json); i++)
     {
      ushort c = StringGetCharacter(json, i);
      if(c == ',' || c == '}')
        {
         end = i;
         break;
        }
     }
     
   if(end > 0) return StringSubstr(json, start, end - start);
   return "";
  }

string ExtractJsonString(string json, string key)
  {
   string pattern = "\"" + key + "\":\"";
   int start = StringFind(json, pattern);
   if(start < 0) return "";
   
   start += StringLen(pattern);
   int end = StringFind(json, "\"", start);
   
   if(end > 0) return StringSubstr(json, start, end - start);
   return "";
  }
  
//+------------------------------------------------------------------+
//| Buton Oluşturma                                                  |
//+------------------------------------------------------------------+
void CreateButtons()
  {
   // Buy Butonu
   if(ObjectFind(0, g_btnBuyName) < 0)
     {
      ObjectCreate(0, g_btnBuyName, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_XDISTANCE, 20);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_YDISTANCE, 20);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_XSIZE, 150);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_YSIZE, 30);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_BGCOLOR, clrGreen);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_COLOR, clrWhite);
      ObjectSetString(0, g_btnBuyName, OBJPROP_TEXT, "TÜM BUY'LARI KAPAT");
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_FONTSIZE, 10);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_STATE, false);
      ObjectSetInteger(0, g_btnBuyName, OBJPROP_SELECTABLE, false);
     }
     
   // Sell Butonu
   if(ObjectFind(0, g_btnSellName) < 0)
     {
      ObjectCreate(0, g_btnSellName, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_XDISTANCE, 180); // Buy butonunun yanında
      ObjectSetInteger(0, g_btnSellName, OBJPROP_YDISTANCE, 20);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_XSIZE, 150);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_YSIZE, 30);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_BGCOLOR, clrRed);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_COLOR, clrWhite);
      ObjectSetString(0, g_btnSellName, OBJPROP_TEXT, "TÜM SELL'LERİ KAPAT");
      ObjectSetInteger(0, g_btnSellName, OBJPROP_FONTSIZE, 10);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_STATE, false);
      ObjectSetInteger(0, g_btnSellName, OBJPROP_SELECTABLE, false);
     }
     
   // Pause/Resume Butonu
   if(ObjectFind(0, g_btnPauseName) < 0)
     {
      ObjectCreate(0, g_btnPauseName, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_XDISTANCE, 340); // Sell butonunun yanında
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_YDISTANCE, 20);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_XSIZE, 150);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_YSIZE, 30);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_BGCOLOR, clrGreen);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_COLOR, clrWhite);
      ObjectSetString(0, g_btnPauseName, OBJPROP_TEXT, "KOPYALAMA: AKTİF");
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_FONTSIZE, 10);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_STATE, false);
      ObjectSetInteger(0, g_btnPauseName, OBJPROP_SELECTABLE, false);
     }

   ChartRedraw(0);
  }

//+------------------------------------------------------------------+
//| Buton Silme                                                      |
//+------------------------------------------------------------------+
void DeleteButtons()
  {
   ObjectDelete(0, g_btnBuyName);
   ObjectDelete(0, g_btnSellName);
   ObjectDelete(0, g_btnPauseName);
   ChartRedraw(0);
  }

//+------------------------------------------------------------------+
//| Toplu Kapatma                                                    |
//+------------------------------------------------------------------+
void CloseAllPositions(int type)
  {
   int total = PositionsTotal();
   Print("Toplu kapatma başlatılıyor. Tip: ", type == POSITION_TYPE_BUY ? "BUY" : "SELL");
   
   for(int i = total - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
        {
         // Sadece bu EA'nın pozisyonları (Magic Number)
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber)
           {
            // İstenen tipte mi?
            if((int)PositionGetInteger(POSITION_TYPE) == type)
              {
               if(g_trade.PositionClose(ticket))
                 {
                  Print("Pozisyon kapatıldı: ", ticket);
                 }
               else
                 {
                  Print("HATA: Pozisyon kapatılamadı: ", ticket, " Hata: ", GetLastError());
                 }
              }
           }
        }
     }
  }
//+------------------------------------------------------------------+
