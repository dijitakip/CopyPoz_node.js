//+------------------------------------------------------------------+
//|                                            CopyPoz_Client_V5.mq5 |
//|                                                   Copyright 2026 |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, CopyPoz V5"
#property link      "https://www.mql5.com"
#property version   "5.00"
#property strict

// Gerekli Kütüphaneler
#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

// Socket sabitleri
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1

//+------------------------------------------------------------------+
//| LANGUAGE SYSTEM (Inline)                                         |
//+------------------------------------------------------------------+
enum ENUM_LANGUAGE { LANG_TR = 0, LANG_EN = 1 };

struct LanguageStrings {
   string msg_starting, msg_started, msg_stopping, msg_stopped;
   string msg_tcp_socket_created, msg_tcp_socket_error, msg_tcp_bind_error;
   string msg_tcp_listen_error, msg_tcp_nonblocking_error, msg_tcp_client_connected;
   string msg_tcp_client_disconnected, msg_tcp_client_timeout, msg_tcp_send_error;
   string msg_tcp_accept_error, msg_license_invalid, msg_license_expired;
   string msg_license_valid, msg_license_checking, msg_license_check_failed;
   string msg_license_trial_days_left, msg_license_trial_expired;
   string msg_broadcast_positions, msg_no_clients, msg_no_positions, msg_position_count;
   string msg_web_api_sending, msg_web_api_success, msg_web_api_error, msg_web_api_timeout;
   string msg_command_pause, msg_command_resume, msg_command_close_all;
   string msg_command_close_buy, msg_command_close_sell, msg_command_unknown;
   string msg_broadcast_paused, msg_broadcast_resumed;
   string msg_error_socket_creation, msg_error_socket_bind, msg_error_socket_listen;
   string msg_error_socket_accept, msg_error_socket_send, msg_error_socket_close;
   string msg_error_license_invalid, msg_error_license_expired, msg_error_web_api;
   string msg_info_total_clients, msg_info_total_positions, msg_info_broadcast_interval;
   string msg_info_web_api_interval, msg_info_license_type, msg_info_license_expiry;
};

LanguageStrings GetLanguageTR() {
   LanguageStrings lang;
   lang.msg_starting = "--- Client EA V5 Başlatılıyor ---";
   lang.msg_started = "Client EA V5 Başarıyla Başlatıldı";
   lang.msg_stopping = "--- Client EA V5 Sonlandırılıyor ---";
   lang.msg_stopped = "Client EA V5 Sonlandırıldı";
   lang.msg_tcp_socket_created = "Socket oluşturuldu";
   lang.msg_tcp_socket_error = "HATA: Socket oluşturulamadı";
   lang.msg_tcp_client_connected = "Master'a bağlandı";
   lang.msg_tcp_client_disconnected = "Master bağlantısı kapatıldı";
   lang.msg_tcp_client_timeout = "Master timeout";
   lang.msg_tcp_send_error = "HATA: Gönderme başarısız";
   lang.msg_tcp_nonblocking_error = "HATA: Non-blocking mode ayarlanamadı";
   lang.msg_web_api_sending = "Web API'ye gönderiliyor";
   lang.msg_web_api_success = "Web API Başarılı";
   lang.msg_web_api_error = "Web API Hatası";
   lang.msg_broadcast_paused = "Senkronizasyon DURDURULDU";
   lang.msg_broadcast_resumed = "Senkronizasyon DEVAM ETTİRİLDİ";
   lang.msg_info_total_clients = "Toplam client";
   return lang;
}

LanguageStrings GetLanguageEN() {
   LanguageStrings lang;
   lang.msg_starting = "--- Client EA V5 Starting ---";
   lang.msg_started = "Client EA V5 Started Successfully";
   lang.msg_stopping = "--- Client EA V5 Stopping ---";
   lang.msg_stopped = "Client EA V5 Stopped";
   lang.msg_tcp_socket_created = "Socket created";
   lang.msg_tcp_socket_error = "ERROR: Socket creation failed";
   lang.msg_tcp_client_connected = "Connected to Master";
   lang.msg_tcp_client_disconnected = "Master connection closed";
   lang.msg_tcp_client_timeout = "Master timeout";
   lang.msg_tcp_send_error = "ERROR: Send failed";
   lang.msg_tcp_nonblocking_error = "ERROR: Non-blocking mode failed";
   lang.msg_web_api_sending = "Sending to Web API";
   lang.msg_web_api_success = "Web API Success";
   lang.msg_web_api_error = "Web API Error";
   lang.msg_broadcast_paused = "Synchronization PAUSED";
   lang.msg_broadcast_resumed = "Synchronization RESUMED";
   lang.msg_info_total_clients = "Total clients";
   return lang;
}

LanguageStrings GetLanguage(ENUM_LANGUAGE lang_type) {
   return (lang_type == LANG_EN) ? GetLanguageEN() : GetLanguageTR();
}

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+
input string   Language          = "TR";
input string   MasterAddress     = "127.0.0.1:2000";
input int      ReconnectInterval = 5000;
input int      ReceiveTimeout    = 10000;
input bool     LogDetailed       = true;
input bool     LogVerbose        = false; // Detaylı debug loglarını (raw data, timer vb.) aç
input bool     EnableWebMonitor  = true;
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/client.php";
input string   DashboardUrl      = "https://fx.haziroglu.com";
input string   InpClientToken    = "CLIENT_SECRET_TOKEN_123"; // Bu, Web API'ye kayıt olurken kullanılacak MASTER_TOKEN olmalı
input string   RegistrationToken = "MASTER_SECRET_TOKEN_123"; // Registration Token = MASTER_TOKEN
string         ClientToken       = ""; // Initialized in OnInit from InpClientToken
input int      SyncInterval      = 500;
input bool     AutoFetchToken    = true;
input string   ClientSymb        = "EURUSDc";      // Client Symbol (Kullanılacak tek sembol)
input bool     UseSingleSymbol   = true;           // Tek sembol kullanılsın mı?
input string   SymbolMapping     = "";             // Sembol Eşleştirme (Orn: EURUSD=EURUSDc,BTCUSD=BTCUSDm)

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
ENUM_LANGUAGE  g_language = LANG_TR;
LanguageStrings g_lang;

#import "ws2_32.dll"
  int socket(int af, int type, int protocol);
  int connect(int s, const int &addr[], int namelen);
  int send(int s, const uchar &buf[], int len, int flags);
  int recv(int s, uchar &buf[], int len, int flags);
  int closesocket(int s);
  int WSAGetLastError();
  int WSAStartup(int wVersionRequested, uchar &lpWSAData[]);
  int WSACleanup();
  int inet_addr(const uchar &cp[]);
  int htons(int hostshort);
  int setsockopt(int s, int level, int optname, const int &optval[], int optlen);
  int ioctlsocket(int s, int cmd, int &argp);
#import

#define AF_INET         2
#define SOCK_STREAM     1
#define IPPROTO_TCP     6
#define INADDR_ANY      0
#define SOL_SOCKET      0xffff
#define SO_REUSEADDR    0x0004
#define FIONBIO         0x8004667e
#define FIONBIO_UINT    2147772030 // (uint)0x8004667e

struct sockaddr_in {
   short sin_family;
   ushort sin_port;
   uint sin_addr;
   char sin_zero[8];
};

int            g_clientSocket = INVALID_SOCKET;
bool           g_tcpConnected = false;
ulong          g_lastConnectionAttempt = 0;
int            g_connectionAttempts = 0;
ulong          g_lastDataReceived = 0;

bool           g_syncEnabled = true;
ulong          g_lastSync = 0;
ulong          g_lastHeartbeat = 0;
ulong          g_lastCommandCheck = 0;
string         g_authToken = "";
string         g_clientToken = ""; // ClientToken'ın kopyası

CTrade         g_trade;
int            g_magicNumber = 0;

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+
int OnInit() {
   g_language = (Language == "EN") ? LANG_EN : LANG_TR;
   g_lang = GetLanguage(g_language);
   
   // Token'ı input'tan al
   ClientToken = InpClientToken;
   
   // Eğer input boş veya default ise, dosyadan yüklemeyi dene
   if(ClientToken == "" || ClientToken == "CLIENT_SECRET_TOKEN_123") {
       string savedToken = LoadTokenFromFile();
       if(savedToken != "") {
           ClientToken = savedToken;
           g_authToken = savedToken;
           Print("Loaded saved token: ", ClientToken);
       }
   }
   
   Print(g_lang.msg_starting);

   // Token'ı Dashboard'dan al
   g_clientToken = ClientToken; // Input değerini kopyala
   if(AutoFetchToken && EnableWebMonitor) {
      string fetchedToken = FetchClientTokenFromDashboard();
      if(fetchedToken != "") {
         g_clientToken = fetchedToken;
         Print("Client token fetched from Dashboard: ", g_clientToken);
      } else {
         Print("WARNING: Could not fetch token from Dashboard, using default");
      }
   }

   g_magicNumber = (int)(AccountInfoInteger(ACCOUNT_LOGIN) % 1000000) * 10 + 5;
   g_trade.SetExpertMagicNumber(g_magicNumber);

   if(!InitTcpClient()) {
      Print(g_lang.msg_tcp_socket_error);
      return(INIT_FAILED);
   }

   EventSetMillisecondTimer(100);
   
   Print(g_lang.msg_started);
   Print("Master Address: ", MasterAddress);
   Print("Magic Number: ", g_magicNumber);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| EXPERT DEINITIALIZATION                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   Print(g_lang.msg_stopping);
   EventKillTimer();
   
   if(g_clientSocket != INVALID_SOCKET) {
      closesocket(g_clientSocket);
      g_clientSocket = INVALID_SOCKET;
      g_tcpConnected = false;
   }
   WSACleanup();
   
   Print(g_lang.msg_stopped);
}

//+------------------------------------------------------------------+
//| TIMER FUNCTION                                                   |
//+------------------------------------------------------------------+
void OnTimer() {
   if(!g_tcpConnected) {
      if(GetTickCount() - g_lastConnectionAttempt > (ulong)ReconnectInterval) {
         if(ConnectToMaster()) {
            g_tcpConnected = true;
            g_connectionAttempts = 0;
            Print(g_lang.msg_tcp_client_connected);
         } else {
            g_connectionAttempts++;
            g_lastConnectionAttempt = GetTickCount();
            if(LogDetailed) Print("Connection attempt failed: ", g_connectionAttempts);
         }
      }
   } else {
      ReceivePositionsFromMaster();
      
      if(g_syncEnabled && (GetTickCount() - g_lastSync > (ulong)SyncInterval)) {
         SyncPositions();
         g_lastSync = GetTickCount();
      }
   }
     
   if(EnableWebMonitor && (GetTickCount() - g_lastHeartbeat > 5000)) {
      SendHeartbeatToWebAPI();
      g_lastHeartbeat = GetTickCount();
   }
   
   if(EnableWebMonitor && (GetTickCount() - g_lastCommandCheck > 5000)) {
      CheckForCommands();
      g_lastCommandCheck = GetTickCount();
   }
}

//+------------------------------------------------------------------+
//| TCP CLIENT INITIALIZATION                                        |
//+------------------------------------------------------------------+
bool InitTcpClient() {
   ResetLastError();
   
   uchar wsaData[400];
   if(WSAStartup(0x202, wsaData) != 0) {
      Print("WSAStartup failed");
      return false;
   }

   g_clientSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
   if(g_clientSocket == INVALID_SOCKET) {
      Print(g_lang.msg_tcp_socket_error, " Error: ", WSAGetLastError());
      return false;
   }
   
   if(LogDetailed) Print(g_lang.msg_tcp_socket_created, ": ", g_clientSocket);
   
   return true;
}

//+------------------------------------------------------------------+
//| CONNECT TO MASTER                                                |
//+------------------------------------------------------------------+
bool ConnectToMaster() {
   if(g_clientSocket == INVALID_SOCKET) {
      if(!InitTcpClient())
         return false;
   }
   
   if(g_tcpConnected) return true; // Already connected
   
   ResetLastError();
   
   string ip = MasterAddress;
   uint port = 2000;
   int colon = StringFind(MasterAddress, ":");
   if(colon != -1) {
      ip = StringSubstr(MasterAddress, 0, colon);
      port = (uint)StringToInteger(StringSubstr(MasterAddress, colon + 1));
   }
   
   int server_addr[4];
   
   uchar ip_chars[];
   StringToCharArray(ip, ip_chars);
   
   server_addr[0] = (AF_INET) | (htons((int)port) << 16);
   server_addr[1] = inet_addr(ip_chars);
   server_addr[2] = 0;
   server_addr[3] = 0;
   
   if(connect(g_clientSocket, server_addr, 16) == -1) {
      int error = WSAGetLastError();
      if(error != 10035) {
         if(LogDetailed) {
             Print("Master connection failed. Error: ", error);
             Print("Target IP: ", ip, " Port: ", port);
             // 10051 = Network is unreachable. This usually means routing issue or local interface issue.
             // 10061 = Connection refused. This means target machine rejected it (port closed/firewall).
             if(error == 10051) Print("Error 10051: Network Unreachable. Check if IP is correct and route exists.");
             if(error == 10061) Print("Error 10061: Connection Refused. Check if Master EA is running and Firewall allows port ", port);
         }
         closesocket(g_clientSocket);
         g_clientSocket = INVALID_SOCKET;
         return false;
      }
   }
   
   // Set non-blocking mode AFTER connect (or before, but usually blocking connect is easier for clients, 
   // but if we want non-blocking connect we check EWOULDBLOCK. 
   // Here let's keep it simple: blocking connect (default) then set non-blocking for reads)
   
   int nonBlocking = 1;
   ioctlsocket(g_clientSocket, (int)FIONBIO, nonBlocking);
   
   g_tcpConnected = true;
   if(LogDetailed) Print("Connected to Master at ", ip, ":", port);
   
   g_lastDataReceived = GetTickCount();
   return true;
}

//+------------------------------------------------------------------+
//| RECEIVE POSITIONS FROM MASTER                                    |
//+------------------------------------------------------------------+
void ReceivePositionsFromMaster() {
   if(g_clientSocket == INVALID_SOCKET || !g_tcpConnected) {
      // If we think we are connected but socket is invalid, reset state
      if(g_tcpConnected) g_tcpConnected = false;
      return;
   }
   

   
   uchar buffer[65536];
   int received = recv(g_clientSocket, buffer, 65536, 0);
   
   if(received == -1) {
      int error = WSAGetLastError();
      if(error != 10035) { // WSAEWOULDBLOCK
         Print("Master receive error! Error: ", error);
         closesocket(g_clientSocket);
         g_clientSocket = INVALID_SOCKET;
         g_tcpConnected = false;
      }
      return;
   }
   
   if(received == 0) {
      Print("Master connection closed");
      closesocket(g_clientSocket);
      g_clientSocket = INVALID_SOCKET;
      g_tcpConnected = false;
      return;
   }
   
   g_lastDataReceived = GetTickCount();
   
   if(received > 0) {
      if(LogVerbose) Print("Data received from Master: ", received, " bytes");
      // Add raw data dump for debugging
      string rawData = CharArrayToString(buffer, 0, received);
      if(LogVerbose) Print("Raw Data Preview: ", StringSubstr(rawData, 0, 50), "...");
      
      ParseMasterPositions(rawData);
   }
}

//+------------------------------------------------------------------+
//| PARSE POSITION DATA                                              |
//+------------------------------------------------------------------+
struct MasterPosition {
   ulong ticket;
   string symbol;
   int type;
   double volume;
   double price;
   double sl;
   double tp;
   int magic;
   string comment;
   double profit;
};

MasterPosition g_masterPositions[];
int g_masterPositionCount = 0;

void ParseMasterPositions(string json) {
   // Debug log for full JSON (truncated if too long)
   if(LogVerbose) {
       // Print("Parsing JSON length: ", StringLen(json));
       // Print("JSON Start: ", StringSubstr(json, 0, 50));
   }

   int startPos = StringFind(json, "\"positions\":[");
   if(startPos == -1) {
       if(LogVerbose) Print("Error: 'positions' array not found in JSON");
       return;
   }
   
   startPos += 13; // Length of "positions":[  (wait, quotes included? "\"positions\":[") -> 13 chars? 
   // "positions":[ -> 12 chars if no quotes around positions? No, JSON has quotes.
   // "\"positions\":[" -> 13 chars.
   
   int endPos = StringFind(json, "]", startPos);
   if(endPos == -1) {
       if(LogVerbose) Print("Error: JSON array end ']' not found");
       return;
   }
   
   string positionsStr = StringSubstr(json, startPos, endPos - startPos);
   
   // Parse positions array
   ArrayResize(g_masterPositions, 0);
   g_masterPositionCount = 0;
   
   int pos = 0;
   while(pos < StringLen(positionsStr)) {
      int objStart = StringFind(positionsStr, "{", pos);
      if(objStart == -1) break;
      
      int objEnd = StringFind(positionsStr, "}", objStart);
      if(objEnd == -1) break;
      
      string posObj = StringSubstr(positionsStr, objStart, objEnd - objStart + 1);
      
      MasterPosition mp;
      mp.ticket = (ulong)ExtractJsonNumber(posObj, "ticket");
      mp.symbol = ExtractJsonString(posObj, "symbol");
      mp.type = (int)ExtractJsonNumber(posObj, "type");
      mp.volume = ExtractJsonNumber(posObj, "volume");
      mp.price = ExtractJsonNumber(posObj, "price");
      mp.sl = ExtractJsonNumber(posObj, "sl");
      mp.tp = ExtractJsonNumber(posObj, "tp");
      mp.magic = (int)ExtractJsonNumber(posObj, "magic");
      mp.comment = ExtractJsonString(posObj, "comment");
      mp.profit = ExtractJsonNumber(posObj, "profit");
      
      ArrayResize(g_masterPositions, g_masterPositionCount + 1);
      g_masterPositions[g_masterPositionCount] = mp;
      g_masterPositionCount++;
      
      pos = objEnd + 1;
   }
   
   if(LogVerbose) Print("Parsed ", g_masterPositionCount, " positions from Master");
   
   // Trigger sync immediately after parsing
   SyncPositions();
}

//+------------------------------------------------------------------+
//| SYNC POSITIONS                                                   |
//+------------------------------------------------------------------+
void SyncPositions() {
   if(!g_syncEnabled) return;
   if(g_masterPositionCount == 0) return;
   
   // 1. Open new positions from Master
   for(int i = 0; i < g_masterPositionCount; i++) {
      if(!FindLocalPosition(g_masterPositions[i].ticket)) {
         if(LogDetailed) Print("Opening missing position for Master Ticket: ", g_masterPositions[i].ticket);
         OpenPosition(g_masterPositions[i]);
      }
   }
   
   // OPTIMIZED SYNC: Combine update and close logic into one loop
   int total = PositionsTotal();
   for(int i = total - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(PositionGetInteger(POSITION_MAGIC) == g_magicNumber) {
            string comment = PositionGetString(POSITION_COMMENT);
            ulong masterTicket = ExtractMasterTicket(comment);
            
            int mpIndex = FindMasterPositionIndex(masterTicket);
            if(mpIndex != -1) {
               // Master has this position, check for updates
               MasterPosition mp = g_masterPositions[mpIndex];
               double currentSL = PositionGetDouble(POSITION_SL);
               double currentTP = PositionGetDouble(POSITION_TP);
               
               // Use NormalizeDouble to compare prices
               // TOLERANCE FIX: Use a smaller threshold (0.1 Point instead of 1 Point)
               if(NormalizeDouble(MathAbs(currentSL - mp.sl), _Digits) > (_Point * 0.1) || 
                  NormalizeDouble(MathAbs(currentTP - mp.tp), _Digits) > (_Point * 0.1)) {
                  g_trade.PositionModify(ticket, mp.sl, mp.tp);
                  if(LogDetailed) Print("Updated SL/TP for Ticket: ", ticket, " SL: ", mp.sl, " TP: ", mp.tp);
               }
            } else {
               // Master does NOT have this position (ORPHAN), close it
               if(LogDetailed) Print("Closing orphan position: ", ticket, " Master Ticket: ", masterTicket);
               g_trade.PositionClose(ticket);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| FIND LOCAL POSITION BY MASTER TICKET                             |
//+------------------------------------------------------------------+
bool FindLocalPosition(ulong masterTicket) {
   for(int i = 0; i < PositionsTotal(); i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(PositionGetInteger(POSITION_MAGIC) == g_magicNumber) {
            string comment = PositionGetString(POSITION_COMMENT);
            ulong mt = ExtractMasterTicket(comment);
            if(mt == masterTicket) return true;
         }
      }
   }
   return false;
}

//+------------------------------------------------------------------+
//| FIND MASTER POSITION INDEX                                       |
//+------------------------------------------------------------------+
int FindMasterPositionIndex(ulong masterTicket) {
   for(int i = 0; i < g_masterPositionCount; i++) {
      if(g_masterPositions[i].ticket == masterTicket) {
         return i;
      }
   }
   return -1;
}

//+------------------------------------------------------------------+
//| EXTRACT MASTER TICKET FROM COMMENT                               |
//+------------------------------------------------------------------+
ulong ExtractMasterTicket(string comment) {
   int pos = StringFind(comment, "MT:");
   if(pos == -1) return 0;
   
   pos += 3;
   int endPos = StringFind(comment, "_", pos);
   if(endPos == -1) endPos = StringLen(comment);
   
   string ticketStr = StringSubstr(comment, pos, endPos - pos);
   return (ulong)StringToInteger(ticketStr);
}

//+------------------------------------------------------------------+
//| OPEN POSITION                                                    |
//+------------------------------------------------------------------+
void OpenPosition(MasterPosition &mp) {
   string clientSymbol = ConvertSymbol(mp.symbol);
   
   if(clientSymbol == "") {
      Print("Error: Symbol not found for ", mp.symbol);
      return;
   }
   
   if(!SymbolSelect(clientSymbol, true)) {
      Print("Error: Failed to select symbol ", clientSymbol);
      return;
   }
   
   double bid = SymbolInfoDouble(clientSymbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(clientSymbol, SYMBOL_ASK);
   
   double price = (mp.type == POSITION_TYPE_BUY) ? ask : bid;
   
   string comment = StringFormat("CPv5_MT:%llu_%s", mp.ticket, mp.symbol);
   
   ENUM_ORDER_TYPE orderType = (ENUM_ORDER_TYPE)mp.type;
   
   if(orderType == ORDER_TYPE_BUY) {
      if(g_trade.Buy(mp.volume, clientSymbol, price, mp.sl, mp.tp, comment)) {
         if(LogDetailed) Print("Position opened: ", clientSymbol, " ", mp.volume, " MT:", mp.ticket);
      } else {
         Print("Error opening position: ", clientSymbol, " Error: ", GetLastError());
      }
   } else if(orderType == ORDER_TYPE_SELL) {
      if(g_trade.Sell(mp.volume, clientSymbol, price, mp.sl, mp.tp, comment)) {
         if(LogDetailed) Print("Position opened: ", clientSymbol, " ", mp.volume, " MT:", mp.ticket);
      } else {
         Print("Error opening position: ", clientSymbol, " Error: ", GetLastError());
      }
   } else {
      Print("Invalid order type: ", orderType);
   }
}

//+------------------------------------------------------------------+
//| CONVERT SYMBOL                                                   |
//+------------------------------------------------------------------+
string ConvertSymbol(string masterSymbol) {
   // 0. Sembol Eşleştirme (Symbol Mapping) - EN YÜKSEK ÖNCELİK
   // Format: EURUSD=EURUSDc,BTCUSD=BTCUSDm
   if(SymbolMapping != "") {
      string rules[];
      // Virgül ile kuralları ayır
      int ruleCount = StringSplit(SymbolMapping, ',', rules);
      
      for(int i = 0; i < ruleCount; i++) {
         string parts[];
         // Eşittir ile Master ve Client sembolünü ayır
         if(StringSplit(rules[i], '=', parts) == 2) {
            string mSym = parts[0];
            string cSym = parts[1];
            
            // Olası boşlukları temizle
            StringTrimLeft(mSym); StringTrimRight(mSym);
            StringTrimLeft(cSym); StringTrimRight(cSym);
            
            // Eğer master sembolü eşleşiyorsa
            if(mSym == masterSymbol) {
               // Client sembolü Market Watch'ta var mı kontrol et
               if(SymbolSelect(cSym, true)) 
                  return cSym;
               else
                  Print("UYARI: Eşleştirilen sembol bulunamadı: ", cSym);
            }
         }
      }
   }

   // 1. Kullanıcı tek sembol zorlamışsa veya ClientSymb tanımlıysa
   if(UseSingleSymbol && ClientSymb != "") {
      if(SymbolSelect(ClientSymb, true))
         return ClientSymb;
   }
   
   // 2. Birebir eşleşme
   if(SymbolSelect(masterSymbol, true))
      return masterSymbol;
      
   // 3. Yaygın sonekler (Suffix)
   string suffixes[] = {".c", ".m", "+", ".pro", "_i", ".ecn", "c", "m", "_mini", "_micro"};
   for(int i = 0; i < ArraySize(suffixes); i++) {
      string trySym = masterSymbol + suffixes[i];
      if(SymbolSelect(trySym, true))
         return trySym;
   }
   
   // 4. Özel dönüşümler
   if(masterSymbol == "XAUUSD" && SymbolSelect("GOLD", true)) return "GOLD";
   if(masterSymbol == "GOLD" && SymbolSelect("XAUUSD", true)) return "XAUUSD";
   
   return "";
}

//+------------------------------------------------------------------+
//| SEND HEARTBEAT TO WEB API                                        |
//+------------------------------------------------------------------+
void SendHeartbeatToWebAPI() {
   if(!EnableWebMonitor) return;
   
   string json;
   if(g_authToken == "") {
      // Try to recover token if we are already registered
      json = StringFormat(
         "{\"account_number\":%llu,\"registration_token\":\"%s\"}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         RegistrationToken
      );
   } else {
      json = StringFormat(
         "{\"account_number\":%llu,\"auth_token\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"positions\":%d}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         g_authToken,
         AccountInfoDouble(ACCOUNT_BALANCE),
         AccountInfoDouble(ACCOUNT_EQUITY),
         PositionsTotal()
      );
   }
   
   char data[];
   StringToCharArray(json, data, 0, StringLen(json));
   
   char result[];
   string resultHeaders;
   string token = (g_authToken != "") ? g_authToken : ClientToken;
   // If token is just the placeholder, don't use it for Authorization if we are registering
   if(g_authToken == "" && token == "CLIENT_SECRET_TOKEN_123") {
       // We are registering, maybe we don't need Authorization header or it should be something else?
       // Based on client.php logic:
       // If existing client: checks 'auth_token' from input matches DB
       // If new client: checks 'registration_token' from input matches MASTER_TOKEN
       // But the 'Authorization: Bearer' header is NOT checked in client.php explicitly shown.
       // However, tokens.php DOES check it if we were hitting that.
       // client.php uses $data['auth_token'] for verification.
       
       // Let's look at client.php again. It doesn't check HTTP headers for auth.
       // So this header might be irrelevant or confusing for debug, but it shouldn't cause 401 unless server enforces it globally.
       // The 401 comes from: jsonResponse(['error' => 'Unauthorized - Invalid token'], 401);
       // This happens when: existing client in DB, but provided auth_token (in JSON body) doesn't match DB.
   }
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + token;
   
   if(LogVerbose) Print(g_lang.msg_web_api_sending);
   
   int res = WebRequest("POST", WebMonitorUrl, headers, 5000, data, result, resultHeaders);
   
   if(res == 200) {
      string response = CharArrayToString(result);
      string token = ExtractJsonString(response, "auth_token");
      if(token != "") {
         if(g_authToken != token) {
             g_authToken = token;
             SaveTokenToFile(token);
             if(LogDetailed) Print("Auth token received and saved: ", token);
         }
      }
      
      // Check for commands in response
      string command = ExtractJsonString(response, "command");
      if(command != "") {
         ExecuteCommand(command);
      }
      
      // if(LogDetailed) Print(g_lang.msg_web_api_success);
   } else {
      // 401 Unauthorized - Invalid token. This means we might have a stale token or no token but the server knows us.
      // Or we are sending a registration request but the server thinks we are already registered and expects a token?
      // Wait, client.php says:
      // if (!$client) { register } else { verify auth_token }
      // So if we are in DB, we MUST provide correct auth_token.
      // If we lost it (restart), we are stuck because we don't have it.
      // We need a way to RE-AUTHENTICATE or RESET token if we have the master registration token.
      
      if(res == 401) {
          if(LogDetailed) Print("CRITICAL: Authentication failed (401). Resetting local token...");
          
          // Tokenı bellekte ve dosyada temizle
          g_authToken = "";
          ClientToken = ""; 
          
          // Token dosyasını sil
          if(FileIsExist("copypoz_client_token.txt")) {
             FileDelete("copypoz_client_token.txt");
             if(LogDetailed) Print("Deleted stale token file.");
          }
          
          // Registration token ile yeniden kayıt olmayı dene (bir sonraki döngüde)
          if(LogDetailed) Print("Will try to re-register with RegistrationToken in next cycle.");
          return; // Fonksiyondan çık, bir sonraki timer döngüsünde yeniden denesin
      }
      
      if(LogDetailed) {
         Print(g_lang.msg_web_api_error, " Code: ", res);
         string response = CharArrayToString(result);
         Print("Response: ", response);
         Print("Sent Headers: ", headers);
         Print("Sent Body: ", json);
      }
   }
}

//+------------------------------------------------------------------+
//| CHECK FOR COMMANDS                                               |
//+------------------------------------------------------------------+
void CheckForCommands() {
   if(!EnableWebMonitor) return;
   
   string commandUrl = "https://fx.haziroglu.com/api/client-command.php";
   
   char data[];
   char result[];
   string resultHeaders;
   string token = (g_authToken != "") ? g_authToken : ClientToken;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + token;
   
   int res = WebRequest("GET", commandUrl, headers, 5000, data, result, resultHeaders);
   
   if(res != 200) {
      if(LogDetailed) Print("Command check failed. Code: ", res);
      
      // 401 Hatası alınırsa tokenı sıfırla (SendHeartbeatToWebAPI ile aynı mantık)
      if(res == 401) {
         if(LogDetailed) Print("Command check 401: Invalid token. Resetting...");
         g_authToken = "";
         if(FileIsExist("copypoz_client_token.txt")) FileDelete("copypoz_client_token.txt");
      }
      return;
   }
   
   string response = CharArrayToString(result);
   
   if(response == "" || response == "null") {
      // if(LogDetailed) Print("No pending commands");
      return;
   }
   
   string command = ExtractJsonString(response, "command");
   
   if(command == "") {
      Print("Command parse failed");
      return;
   }
   
   Print("Command received: ", command);
   ExecuteCommand(command);
}

//+------------------------------------------------------------------+
//| EXECUTE COMMAND                                                  |
//+------------------------------------------------------------------+
void ExecuteCommand(string command) {
   if(command == "PAUSE") {
      g_syncEnabled = false;
      Print(g_lang.msg_broadcast_paused);
   }
   else if(command == "RESUME") {
      g_syncEnabled = true;
      Print(g_lang.msg_broadcast_resumed);
   }
   else if(command == "CLOSE_ALL_BUY") {
      CloseAllPositions(POSITION_TYPE_BUY);
      Print("All BUY positions closed");
   }
   else if(command == "CLOSE_ALL_SELL") {
      CloseAllPositions(POSITION_TYPE_SELL);
      Print("All SELL positions closed");
   }
   else if(command == "CLOSE_ALL") {
      CloseAllPositions(POSITION_TYPE_BUY);
      CloseAllPositions(POSITION_TYPE_SELL);
      Print("All positions closed");
   }
   else {
      Print("Unknown command: ", command);
   }
}

//+------------------------------------------------------------------+
//| CLOSE ALL POSITIONS                                              |
//+------------------------------------------------------------------+
void CloseAllPositions(ENUM_POSITION_TYPE posType) {
   int total = PositionsTotal();
   
   for(int i = total - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(PositionGetInteger(POSITION_MAGIC) == g_magicNumber) {
            if(PositionGetInteger(POSITION_TYPE) == posType) {
               if(g_trade.PositionClose(ticket)) {
                  Print("Position closed: ", ticket);
               } else {
                  Print("Position close failed: ", ticket, " Error: ", GetLastError());
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| SAVE TOKEN TO FILE                                               |
//+------------------------------------------------------------------+
void SaveTokenToFile(string token) {
    int fileHandle = FileOpen("copypoz_client_token.txt", FILE_WRITE|FILE_TXT);
    if(fileHandle != INVALID_HANDLE) {
        FileWriteString(fileHandle, token);
        FileClose(fileHandle);
    }
}

//+------------------------------------------------------------------+
//| LOAD TOKEN FROM FILE                                             |
//+------------------------------------------------------------------+
string LoadTokenFromFile() {
    string token = "";
    int fileHandle = FileOpen("copypoz_client_token.txt", FILE_READ|FILE_TXT);
    if(fileHandle != INVALID_HANDLE) {
        token = FileReadString(fileHandle);
        FileClose(fileHandle);
    }
    return token;
}

//+------------------------------------------------------------------+
//| EXTRACT JSON STRING                                              |
//+------------------------------------------------------------------+
string ExtractJsonString(string json, string key) {
   string searchKey = "\"" + key + "\":\"";
   int startPos = StringFind(json, searchKey);
   
   if(startPos == -1) return "";
   
   startPos += StringLen(searchKey);
   int endPos = StringFind(json, "\"", startPos);
   
   if(endPos == -1) return "";
   
   return StringSubstr(json, startPos, endPos - startPos);
}

//+------------------------------------------------------------------+
//| EXTRACT JSON NUMBER                                              |
//+------------------------------------------------------------------+
double ExtractJsonNumber(string json, string key) {
   string searchKey = "\"" + key + "\":";
   int startPos = StringFind(json, searchKey);
   
   if(startPos == -1) return 0;
   
   startPos += StringLen(searchKey);
   
   // Skip whitespace
   while(startPos < StringLen(json) && (json[startPos] == ' ' || json[startPos] == '\t')) {
      startPos++;
   }
   
   int endPos = startPos;
   while(endPos < StringLen(json) && json[endPos] != ',' && json[endPos] != '}' && json[endPos] != ']') {
      endPos++;
   }
   
   string numStr = StringSubstr(json, startPos, endPos - startPos);
   return StringToDouble(numStr);
}

//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//| FETCH CLIENT TOKEN FROM DASHBOARD                                |
//+------------------------------------------------------------------+
string FetchClientTokenFromDashboard() {
   // JSON'dan auth_token değerini bul
   // NOT: Dashboard birden fazla token döndürebilir (list action).
   // Bu yüzden kendi account_number'ımızla eşleşen objeyi bulmamız lazım.
   // Ancak basitlik adına, genellikle tek bir client hesabı olduğunu varsayarsak ilk tokenı alabiliriz.
   // VEYA: Dashboard'a parametre olarak account_number ekleyip sadece onu istemek daha doğru olur.
   // Şimdilik mevcut URL'ye account_number ekleyelim:
   
   // Mevcut URL'yi güncelle:
   // string tokenUrl = DashboardUrl + "/admin/tokens.php?action=list&type=client";
   // YENİ URL:
   string tokenUrl = DashboardUrl + "/admin/tokens.php?action=list&type=client&account=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   
   char data[];
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", tokenUrl, "", 5000, data, result, resultHeaders);
   
   if(res != 200) {
      Print("Failed to fetch token from Dashboard. Code: ", res);
      return "";
   }
   
   string response = CharArrayToString(result);
   
   // JSON'dan ilk client'ın tokenını al
   int startPos = StringFind(response, "\"auth_token\":\"");
   if(startPos == -1) {
      Print("Token not found in Dashboard response");
      return "";
   }
   
   startPos += 14; // "auth_token":" uzunluğu
   int endPos = StringFind(response, "\"", startPos);
   
   if(endPos == -1) {
      Print("Token parsing failed");
      return "";
   }
   
   string token = StringSubstr(response, startPos, endPos - startPos);
   return token;
}

//+------------------------------------------------------------------+
