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
input string   RegistrationToken = "CLIENT_REG_TOKEN";
input string   MasterAddress     = "127.0.0.1:2000";
input int      ReconnectInterval = 5000;
input int      ReceiveTimeout    = 10000;
input bool     LogDetailed       = true;
input bool     EnableWebMonitor  = true;
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/client.php";
input string   ClientToken       = "CLIENT_SECRET_TOKEN_123";
input int      SyncInterval      = 500;

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
ENUM_LANGUAGE  g_language = LANG_TR;
LanguageStrings g_lang;

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

CTrade         g_trade;
int            g_magicNumber = 0;

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+
int OnInit() {
   g_language = (Language == "EN") ? LANG_EN : LANG_TR;
   g_lang = GetLanguage(g_language);
   
   Print(g_lang.msg_starting);

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
      SocketClose(g_clientSocket);
      g_clientSocket = INVALID_SOCKET;
      g_tcpConnected = false;
   }
   
   Print(g_lang.msg_stopped);
}

//+------------------------------------------------------------------+
//| TIMER FUNCTION                                                   |
//+------------------------------------------------------------------+
void OnTimer() {
   if(!g_tcpConnected) {
      if(GetTickCount() - g_lastConnectionAttempt > ReconnectInterval) {
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
      
      if(g_syncEnabled && (GetTickCount() - g_lastSync > SyncInterval)) {
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
   
   g_clientSocket = SocketCreate(SOCK_STREAM);
   if(g_clientSocket == INVALID_SOCKET) {
      Print(g_lang.msg_tcp_socket_error, " Error: ", GetLastError());
      return false;
   }
   
   if(LogDetailed) Print(g_lang.msg_tcp_socket_created, ": ", g_clientSocket);
   
   if(!SocketSetNonBlocking(g_clientSocket)) {
      Print(g_lang.msg_tcp_nonblocking_error, " Error: ", GetLastError());
      SocketClose(g_clientSocket);
      g_clientSocket = INVALID_SOCKET;
      return false;
   }
   
   if(LogDetailed) Print("Non-blocking mode set");
   
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
   
   ResetLastError();
   
   if(!SocketConnect(g_clientSocket, MasterAddress)) {
      int error = GetLastError();
      if(error != 10035) {
         if(LogDetailed) Print("Master connection failed. Error: ", error);
         return false;
      }
   }
   
   g_lastDataReceived = GetTickCount();
   return true;
}

//+------------------------------------------------------------------+
//| RECEIVE POSITIONS FROM MASTER                                    |
//+------------------------------------------------------------------+
void ReceivePositionsFromMaster() {
   if(g_clientSocket == INVALID_SOCKET || !g_tcpConnected)
      return;
   
   char buffer[65536];
   int received = SocketReceive(g_clientSocket, buffer, 65536);
   
   if(received == SOCKET_ERROR) {
      int error = GetLastError();
      if(error != 10035) {
         Print("Master receive error! Error: ", error);
         SocketClose(g_clientSocket);
         g_clientSocket = INVALID_SOCKET;
         g_tcpConnected = false;
      }
      return;
   }
   
   if(received == 0) {
      Print("Master connection closed");
      SocketClose(g_clientSocket);
      g_clientSocket = INVALID_SOCKET;
      g_tcpConnected = false;
      return;
   }
   
   g_lastDataReceived = GetTickCount();
   
   string data = CharArrayToString(buffer, 0, received);
   if(LogDetailed) Print("Data received from Master: ", received, " bytes");
   
   ParsePositionData(data);
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

void ParsePositionData(string json) {
   int startPos = StringFind(json, "\"positions\":[");
   if(startPos == -1) return;
   
   startPos += 14;
   int endPos = StringFind(json, "]", startPos);
   if(endPos == -1) return;
   
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
   
   if(LogDetailed) Print("Parsed ", g_masterPositionCount, " positions from Master");
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
         OpenPosition(g_masterPositions[i]);
      }
   }
   
   // 2. Update existing positions (SL/TP)
   for(int i = 0; i < PositionsTotal(); i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(PositionGetInteger(POSITION_MAGIC) == g_magicNumber) {
            string comment = PositionGetString(POSITION_COMMENT);
            ulong masterTicket = ExtractMasterTicket(comment);
            
            MasterPosition *mp = FindMasterPosition(masterTicket);
            if(mp != NULL) {
               double currentSL = PositionGetDouble(POSITION_SL);
               double currentTP = PositionGetDouble(POSITION_TP);
               
               if(currentSL != mp.sl || currentTP != mp.tp) {
                  g_trade.PositionModify(ticket, mp.sl, mp.tp);
               }
            }
         }
      }
   }
   
   // 3. Close orphan positions
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(PositionGetInteger(POSITION_MAGIC) == g_magicNumber) {
            string comment = PositionGetString(POSITION_COMMENT);
            ulong masterTicket = ExtractMasterTicket(comment);
            
            if(FindMasterPosition(masterTicket) == NULL) {
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
//| FIND MASTER POSITION                                             |
//+------------------------------------------------------------------+
MasterPosition* FindMasterPosition(ulong masterTicket) {
   for(int i = 0; i < g_masterPositionCount; i++) {
      if(g_masterPositions[i].ticket == masterTicket) {
         return &g_masterPositions[i];
      }
   }
   return NULL;
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
   double bid = SymbolInfoDouble(mp.symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(mp.symbol, SYMBOL_ASK);
   
   double price = (mp.type == POSITION_TYPE_BUY) ? ask : bid;
   
   string comment = StringFormat("CPv5_MT:%I64d_%s", mp.ticket, mp.symbol);
   
   if(mp.type == POSITION_TYPE_BUY) {
      g_trade.Buy(mp.volume, mp.symbol, price, mp.sl, mp.tp, comment);
   } else {
      g_trade.Sell(mp.volume, mp.symbol, price, mp.sl, mp.tp, comment);
   }
   
   if(LogDetailed) Print("Position opened: ", mp.symbol, " ", mp.volume, " MT:", mp.ticket);
}

//+------------------------------------------------------------------+
//| SEND HEARTBEAT TO WEB API                                        |
//+------------------------------------------------------------------+
void SendHeartbeatToWebAPI() {
   if(!EnableWebMonitor) return;
   
   string json;
   if(g_authToken == "") {
      json = StringFormat(
         "{\"account_number\":%I64d,\"registration_token\":\"%s\"}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         RegistrationToken
      );
   } else {
      json = StringFormat(
         "{\"account_number\":%I64d,\"auth_token\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"positions\":%d}",
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
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + ClientToken;
   
   if(LogDetailed) Print(g_lang.msg_web_api_sending);
   
   int res = WebRequest("POST", WebMonitorUrl, headers, 5000, data, result, resultHeaders);
   
   if(res == 200) {
      string response = CharArrayToString(result);
      string token = ExtractJsonString(response, "auth_token");
      if(token != "") {
         g_authToken = token;
         if(LogDetailed) Print("Auth token received");
      }
      
      // Check for commands in response
      string command = ExtractJsonString(response, "command");
      if(command != "") {
         ExecuteCommand(command);
      }
   } else {
      if(LogDetailed) Print(g_lang.msg_web_api_error, " Code: ", res);
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
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + ClientToken;
   
   int res = WebRequest("GET", commandUrl, headers, 5000, data, result, resultHeaders);
   
   if(res != 200) {
      if(LogDetailed) Print("Command check failed. Code: ", res);
      return;
   }
   
   string response = CharArrayToString(result);
   
   if(response == "" || response == "null") {
      if(LogDetailed) Print("No pending commands");
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
