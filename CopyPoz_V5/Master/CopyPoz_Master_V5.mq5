//+------------------------------------------------------------------+
//|                                            CopyPoz_Master_V5.mq5 |
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
   lang.msg_starting = "--- Master EA V5 Başlatılıyor ---";
   lang.msg_started = "Master EA V5 Başarıyla Başlatıldı";
   lang.msg_stopping = "--- Master EA V5 Sonlandırılıyor ---";
   lang.msg_stopped = "Master EA V5 Sonlandırıldı";
   lang.msg_tcp_socket_created = "Socket oluşturuldu";
   lang.msg_tcp_socket_error = "HATA: Socket oluşturulamadı";
   lang.msg_tcp_bind_error = "HATA: Socket bind başarısız";
   lang.msg_tcp_listen_error = "HATA: Socket listen başarısız";
   lang.msg_tcp_nonblocking_error = "HATA: Non-blocking mode ayarlanamadı";
   lang.msg_tcp_client_connected = "Yeni client bağlandı";
   lang.msg_tcp_client_disconnected = "Client bağlantısı kapatıldı";
   lang.msg_tcp_client_timeout = "Client timeout";
   lang.msg_tcp_send_error = "HATA: Client'a gönderme başarısız";
   lang.msg_tcp_accept_error = "HATA: Bağlantı kabul başarısız";
   lang.msg_license_invalid = "HATA: Geçersiz lisans anahtarı";
   lang.msg_license_expired = "HATA: Lisans süresi dolmuş";
   lang.msg_license_valid = "Lisans geçerli";
   lang.msg_license_checking = "Lisans kontrol ediliyor";
   lang.msg_license_check_failed = "HATA: Lisans kontrol başarısız";
   lang.msg_broadcast_positions = "Pozisyon yayını";
   lang.msg_no_clients = "Hiç client yok";
   lang.msg_web_api_sending = "Web API'ye gönderiliyor";
   lang.msg_web_api_success = "Web API Başarılı";
   lang.msg_web_api_error = "Web API Hatası";
   lang.msg_broadcast_paused = "Pozisyon yayını DURDURULDU";
   lang.msg_broadcast_resumed = "Pozisyon yayını DEVAM ETTİRİLDİ";
   lang.msg_info_total_clients = "Toplam client";
   return lang;
}

LanguageStrings GetLanguageEN() {
   LanguageStrings lang;
   lang.msg_starting = "--- Master EA V5 Starting ---";
   lang.msg_started = "Master EA V5 Started Successfully";
   lang.msg_stopping = "--- Master EA V5 Stopping ---";
   lang.msg_stopped = "Master EA V5 Stopped";
   lang.msg_tcp_socket_created = "Socket created";
   lang.msg_tcp_socket_error = "ERROR: Socket creation failed";
   lang.msg_tcp_bind_error = "ERROR: Socket bind failed";
   lang.msg_tcp_listen_error = "ERROR: Socket listen failed";
   lang.msg_tcp_nonblocking_error = "ERROR: Non-blocking mode failed";
   lang.msg_tcp_client_connected = "New client connected";
   lang.msg_tcp_client_disconnected = "Client connection closed";
   lang.msg_tcp_client_timeout = "Client timeout";
   lang.msg_tcp_send_error = "ERROR: Send to client failed";
   lang.msg_tcp_accept_error = "ERROR: Accept connection failed";
   lang.msg_license_invalid = "ERROR: Invalid license key";
   lang.msg_license_expired = "ERROR: License expired";
   lang.msg_license_valid = "License valid";
   lang.msg_license_checking = "Checking license";
   lang.msg_license_check_failed = "ERROR: License check failed";
   lang.msg_broadcast_positions = "Broadcasting positions";
   lang.msg_no_clients = "No clients connected";
   lang.msg_web_api_sending = "Sending to Web API";
   lang.msg_web_api_success = "Web API Success";
   lang.msg_web_api_error = "Web API Error";
   lang.msg_broadcast_paused = "Position broadcast PAUSED";
   lang.msg_broadcast_resumed = "Position broadcast RESUMED";
   lang.msg_info_total_clients = "Total clients";
   return lang;
}

LanguageStrings GetLanguage(ENUM_LANGUAGE lang_type) {
   return (lang_type == LANG_EN) ? GetLanguageEN() : GetLanguageTR();
}

//+------------------------------------------------------------------+
//| LICENSE SYSTEM (Inline)                                          |
//+------------------------------------------------------------------+
enum ENUM_LICENSE_TYPE { LICENSE_TRIAL = 0, LICENSE_PRO = 1, LICENSE_ENTERPRISE = 2 };

struct LicenseInfo {
   ENUM_LICENSE_TYPE type;
   string key;
   bool is_valid;
   bool is_expired;
   int days_left;
   string error_message;
};

LicenseInfo ValidateLicense(string license_key) {
   LicenseInfo license;
   license.key = license_key;
   license.is_valid = false;
   license.is_expired = false;
   license.days_left = 0;
   license.error_message = "";
   
   if(license_key == "" || license_key == "DEMO") {
      license.type = LICENSE_TRIAL;
      license.is_valid = true;
      license.days_left = 30;
      return license;
   }
   
   string parts[];
   int count = StringSplit(license_key, '-', parts);
   
   if(count != 4 || parts[0] != "COPYPOZ") {
      license.error_message = "Invalid license format";
      return license;
   }
   
   if(parts[1] == "TRIAL") license.type = LICENSE_TRIAL;
   else if(parts[1] == "PRO") license.type = LICENSE_PRO;
   else if(parts[1] == "ENTERPRISE") license.type = LICENSE_ENTERPRISE;
   else {
      license.error_message = "Invalid license type";
      return license;
   }
   
   int year = StringToInteger(parts[2]);
   if(year < TimeYear(TimeCurrent())) {
      license.is_expired = true;
      license.error_message = "License year is in the past";
      return license;
   }
   
   license.is_valid = true;
   license.days_left = 365;
   return license;
}

string LicenseTypeToString(ENUM_LICENSE_TYPE type) {
   if(type == LICENSE_TRIAL) return "TRIAL";
   if(type == LICENSE_PRO) return "PRO";
   return "ENTERPRISE";
}

int GetMaxClients(ENUM_LICENSE_TYPE license_type) {
   if(license_type == LICENSE_TRIAL) return 5;
   if(license_type == LICENSE_PRO) return 50;
   return 1000;
}

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+
input string   Language          = "TR";
input string   LicenseKey        = "DEMO";
input string   TcpAddress        = "0.0.0.0:2000";
input int      BroadcastInterval = 500;
input bool     LogDetailed       = true;
input bool     EnableWebMonitor  = true;
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/signal.php";
input string   DashboardUrl      = "https://fx.haziroglu.com";
input string   MasterToken       = "MASTER_SECRET_TOKEN_123";
input int      ConnectionTimeout = 60000;
input bool     AutoFetchToken    = true;

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
ENUM_LANGUAGE  g_language = LANG_TR;
LanguageStrings g_lang;
LicenseInfo    g_license;
ulong          g_lastLicenseCheck = 0;

int            g_serverSocket = INVALID_SOCKET;
int            g_clientSockets[];
ulong          g_clientLastData[];
int            g_clientCount = 0;
bool           g_tcpInitialized = false;

CTrade         g_trade;
ulong          g_lastWebUpdate = 0;
ulong          g_lastBroadcast = 0;
ulong          g_lastCommandCheck = 0;
bool           g_broadcastEnabled = true;
string         g_lastCommand = "";
ulong          g_lastCommandTime = 0;

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+
int OnInit() {
   g_language = (Language == "EN") ? LANG_EN : LANG_TR;
   g_lang = GetLanguage(g_language);
   
   Print(g_lang.msg_starting);

   // Token'ı Dashboard'dan al
   if(AutoFetchToken && EnableWebMonitor) {
      string fetchedToken = FetchMasterTokenFromDashboard();
      if(fetchedToken != "") {
         MasterToken = fetchedToken;
         Print("Master token fetched from Dashboard: ", MasterToken);
      } else {
         Print("WARNING: Could not fetch token from Dashboard, using default");
      }
   }

   g_license = ValidateLicense(LicenseKey);
   
   if(!g_license.is_valid) {
      Print(g_lang.msg_license_invalid);
      Print(g_license.error_message);
      return(INIT_FAILED);
   }
   
   if(g_license.is_expired) {
      Print(g_lang.msg_license_expired);
      return(INIT_FAILED);
   }
   
   Print(g_lang.msg_license_valid);
   Print("License Type: ", LicenseTypeToString(g_license.type));
   Print("Days Left: ", g_license.days_left);
   
   g_trade.SetExpertMagicNumber(0);

   if(!InitTcpServer()) {
      Print(g_lang.msg_tcp_socket_error);
      return(INIT_FAILED);
   }

   EventSetMillisecondTimer(100);
   
   Print(g_lang.msg_started);
   Print("TCP Address: ", TcpAddress);
   Print("Max Clients: ", GetMaxClients(g_license.type));
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| EXPERT DEINITIALIZATION                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   Print(g_lang.msg_stopping);
   EventKillTimer();
   CloseAllConnections();
   if(g_serverSocket != INVALID_SOCKET) {
      SocketClose(g_serverSocket);
      g_serverSocket = INVALID_SOCKET;
   }
   Print(g_lang.msg_stopped);
}

//+------------------------------------------------------------------+
//| TIMER FUNCTION                                                   |
//+------------------------------------------------------------------+
void OnTimer() {
   if(GetTickCount() - g_lastLicenseCheck > (30 * 24 * 60 * 60 * 1000)) {
      CheckLicenseWithAPI();
      g_lastLicenseCheck = GetTickCount();
   }
   
   if(g_tcpInitialized) {
      AcceptNewConnections();
      HandleClientConnections();
      CheckConnectionTimeouts();
   }
     
   if(g_broadcastEnabled && (GetTickCount() - g_lastBroadcast > BroadcastInterval)) {
      BroadcastPositions();
      g_lastBroadcast = GetTickCount();
   }
     
   if(EnableWebMonitor && (GetTickCount() - g_lastWebUpdate > 2000)) {
      SendToWebAPI();
      g_lastWebUpdate = GetTickCount();
   }
     
   if(EnableWebMonitor && (GetTickCount() - g_lastCommandCheck > 5000)) {
      CheckForCommands();
      g_lastCommandCheck = GetTickCount();
   }
}

//+------------------------------------------------------------------+
//| TRADE TRANSACTION                                                |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result) {
   if(!g_tcpInitialized || !g_broadcastEnabled) return;
   if(trans.type == TRADE_TRANSACTION_POSITION || trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      BroadcastPositions();
   }
}

//+------------------------------------------------------------------+
//| TCP SERVER INITIALIZATION                                        |
//+------------------------------------------------------------------+
bool InitTcpServer() {
   ResetLastError();
   
   g_serverSocket = SocketCreate(SOCK_STREAM);
   if(g_serverSocket == INVALID_SOCKET) {
      Print(g_lang.msg_tcp_socket_error, " Error: ", GetLastError());
      return false;
   }
   
   if(LogDetailed) Print(g_lang.msg_tcp_socket_created, ": ", g_serverSocket);
   
   if(!SocketSetNonBlocking(g_serverSocket)) {
      Print(g_lang.msg_tcp_nonblocking_error, " Error: ", GetLastError());
      SocketClose(g_serverSocket);
      g_serverSocket = INVALID_SOCKET;
      return false;
   }
   
   if(!SocketBind(g_serverSocket, TcpAddress)) {
      Print(g_lang.msg_tcp_bind_error, " Address: ", TcpAddress, " Error: ", GetLastError());
      SocketClose(g_serverSocket);
      g_serverSocket = INVALID_SOCKET;
      return false;
   }
   
   if(!SocketListen(g_serverSocket, 50)) {
      Print(g_lang.msg_tcp_listen_error, " Error: ", GetLastError());
      SocketClose(g_serverSocket);
      g_serverSocket = INVALID_SOCKET;
      return false;
   }
   
   ArrayResize(g_clientSockets, 0);
   ArrayResize(g_clientLastData, 0);
   g_clientCount = 0;
   
   g_tcpInitialized = true;
   Print("TCP Server started successfully!");
   return true;
}

//+------------------------------------------------------------------+
//| ACCEPT NEW CONNECTIONS                                           |
//+------------------------------------------------------------------+
void AcceptNewConnections() {
   int max_clients = GetMaxClients(g_license.type);
   if(g_clientCount >= max_clients) return;
   
   int clientSocket = SocketAccept(g_serverSocket);
   if(clientSocket == INVALID_SOCKET) return;
   
   if(LogDetailed) Print(g_lang.msg_tcp_client_connected, "! Socket: ", clientSocket);
   
   SocketSetNonBlocking(clientSocket);
   
   int newSize = g_clientCount + 1;
   ArrayResize(g_clientSockets, newSize);
   ArrayResize(g_clientLastData, newSize);
   
   g_clientSockets[g_clientCount] = clientSocket;
   g_clientLastData[g_clientCount] = GetTickCount();
   g_clientCount++;
   
   Print(g_lang.msg_info_total_clients, ": ", g_clientCount);
}

//+------------------------------------------------------------------+
//| HANDLE CLIENT CONNECTIONS                                        |
//+------------------------------------------------------------------+
void HandleClientConnections() {
   for(int i = 0; i < g_clientCount; i++) {
      if(g_clientSockets[i] == INVALID_SOCKET) continue;
      
      string positionJson = BuildPositionJson();
      
      if(!SendToClient(i, positionJson)) {
         if(LogDetailed) Print("Send to client failed: ", g_clientSockets[i]);
      } else {
         g_clientLastData[i] = GetTickCount();
      }
   }
}

//+------------------------------------------------------------------+
//| CHECK CONNECTION TIMEOUTS                                        |
//+------------------------------------------------------------------+
void CheckConnectionTimeouts() {
   ulong currentTime = GetTickCount();
   
   for(int i = g_clientCount - 1; i >= 0; i--) {
      if(g_clientSockets[i] == INVALID_SOCKET) continue;
      
      if(currentTime - g_clientLastData[i] > ConnectionTimeout) {
         Print("Client timeout! Socket: ", g_clientSockets[i]);
         CloseClientConnection(i);
      }
   }
}

//+------------------------------------------------------------------+
//| SEND TO CLIENT                                                   |
//+------------------------------------------------------------------+
bool SendToClient(int clientIndex, string data) {
   if(clientIndex < 0 || clientIndex >= g_clientCount) return false;
   if(g_clientSockets[clientIndex] == INVALID_SOCKET) return false;
   
   char buffer[];
   StringToCharArray(data, buffer, 0, StringLen(data));
   
   int sent = SocketSend(g_clientSockets[clientIndex], buffer, ArraySize(buffer));
   
   if(sent == SOCKET_ERROR) {
      int error = GetLastError();
      if(error != 10035) {
         Print("ERROR: SocketSend failed! Error: ", error);
         CloseClientConnection(clientIndex);
         return false;
      }
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| CLOSE CLIENT CONNECTION                                          |
//+------------------------------------------------------------------+
void CloseClientConnection(int clientIndex) {
   if(clientIndex < 0 || clientIndex >= g_clientCount) return;
   
   if(g_clientSockets[clientIndex] != INVALID_SOCKET) {
      SocketClose(g_clientSockets[clientIndex]);
      g_clientSockets[clientIndex] = INVALID_SOCKET;
      Print("Client connection closed. Socket: ", g_clientSockets[clientIndex]);
   }
   
   for(int i = clientIndex; i < g_clientCount - 1; i++) {
      g_clientSockets[i] = g_clientSockets[i + 1];
      g_clientLastData[i] = g_clientLastData[i + 1];
   }
   
   g_clientCount--;
   ArrayResize(g_clientSockets, g_clientCount);
   ArrayResize(g_clientLastData, g_clientCount);
   
   Print("Total clients: ", g_clientCount);
}

//+------------------------------------------------------------------+
//| CLOSE ALL CONNECTIONS                                            |
//+------------------------------------------------------------------+
void CloseAllConnections() {
   for(int i = g_clientCount - 1; i >= 0; i--) {
      CloseClientConnection(i);
   }
}

//+------------------------------------------------------------------+
//| BUILD POSITION JSON                                              |
//+------------------------------------------------------------------+
string BuildPositionJson() {
   int total = PositionsTotal();
   string json = "{\"type\":\"POSITIONS_BROADCAST\",\"timestamp\":" + IntegerToString(GetTickCount()) + ",\"positions\":[";
   
   int count = 0;
   for(int i = 0; i < total; i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(count > 0) json += ",";
         
         string symbol = PositionGetString(POSITION_SYMBOL);
         long type = PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double price = PositionGetDouble(POSITION_PRICE_OPEN);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         long magic = PositionGetInteger(POSITION_MAGIC);
         string comment = PositionGetString(POSITION_COMMENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         
         string posJson = StringFormat(
            "{\"ticket\":%I64d,\"symbol\":\"%s\",\"type\":%d,\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"magic\":%d,\"comment\":\"%s\",\"profit\":%.2f}",
            ticket, symbol, type, volume, price, sl, tp, magic, comment, profit
         );
         
         json += posJson;
         count++;
      }
   }
   
   json += "]}";
   return json;
}

//+------------------------------------------------------------------+
//| BROADCAST POSITIONS                                              |
//+------------------------------------------------------------------+
void BroadcastPositions() {
   if(g_clientCount == 0) {
      if(LogDetailed) Print(g_lang.msg_no_clients);
      return;
   }
   
   if(LogDetailed) Print(g_lang.msg_broadcast_positions, ": ", g_clientCount, " clients");
   HandleClientConnections();
}

//+------------------------------------------------------------------+
//| SEND TO WEB API                                                  |
//+------------------------------------------------------------------+
void SendToWebAPI() {
   int total = PositionsTotal();
   string webJson = "{\"positions\":[";
   
   int count = 0;
   for(int i = 0; i < total; i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket)) {
         if(count > 0) webJson += ",";
         
         string symbol = PositionGetString(POSITION_SYMBOL);
         long type = PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double price = PositionGetDouble(POSITION_PRICE_OPEN);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         long magic = PositionGetInteger(POSITION_MAGIC);
         string comment = PositionGetString(POSITION_COMMENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         
         string posJson = StringFormat(
            "{\"ticket\":%I64d,\"symbol\":\"%s\",\"type\":%d,\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"magic\":%d,\"comment\":\"%s\",\"profit\":%.2f}",
            ticket, symbol, type, volume, price, sl, tp, magic, comment, profit
         );
         
         webJson += posJson;
         count++;
      }
   }
   
   webJson += "]}";
   
   char data[];
   StringToCharArray(webJson, data, 0, StringLen(webJson));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + MasterToken;
   
   if(LogDetailed) Print(g_lang.msg_web_api_sending, ": ", WebMonitorUrl);
   
   int res = WebRequest("POST", WebMonitorUrl, headers, 1000, data, result, resultHeaders);
   
   if(res == 200) {
      if(LogDetailed) Print(g_lang.msg_web_api_success);
   } else {
      Print(g_lang.msg_web_api_error, "! Code: ", res);
   }
}

//+------------------------------------------------------------------+
//| CHECK LICENSE WITH API                                           |
//+------------------------------------------------------------------+
void CheckLicenseWithAPI() {
   if(!EnableWebMonitor) return;
   
   Print(g_lang.msg_license_checking);
   
   string checkUrl = "https://fx.haziroglu.com/api/license-check.php";
   
   string json = StringFormat(
      "{\"license_key\":\"%s\",\"terminal_id\":\"%s\"}",
      LicenseKey,
      IntegerToString(TerminalInfoInteger(TERMINAL_COMMONDATA_PATH))
   );
   
   char data[];
   StringToCharArray(json, data, 0, StringLen(json));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + MasterToken;
   
   int res = WebRequest("POST", checkUrl, headers, 5000, data, result, resultHeaders);
   
   if(res == 200) {
      Print(g_lang.msg_license_valid);
   } else if(res == 401) {
      Print(g_lang.msg_license_invalid);
      g_broadcastEnabled = false;
   } else if(res == 403) {
      Print(g_lang.msg_license_expired);
      g_broadcastEnabled = false;
   } else {
      Print(g_lang.msg_license_check_failed, " Code: ", res);
   }
}

//+------------------------------------------------------------------+
//| CHECK FOR COMMANDS                                               |
//+------------------------------------------------------------------+
void CheckForCommands() {
   if(!EnableWebMonitor) return;
   
   string commandUrl = "https://fx.haziroglu.com/api/master-command.php";
   
   char data[];
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + MasterToken;
   
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
   g_lastCommand = command;
   g_lastCommandTime = GetTickCount();
   
   ExecuteCommand(command);
}

//+------------------------------------------------------------------+
//| EXECUTE COMMAND                                                  |
//+------------------------------------------------------------------+
void ExecuteCommand(string command) {
   if(command == "PAUSE") {
      g_broadcastEnabled = false;
      Print(g_lang.msg_broadcast_paused);
   }
   else if(command == "RESUME") {
      g_broadcastEnabled = true;
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
//| FETCH MASTER TOKEN FROM DASHBOARD                                |
//+------------------------------------------------------------------+
string FetchMasterTokenFromDashboard() {
   string tokenUrl = DashboardUrl + "/admin/tokens.php?action=get&id=1&type=master";
   
   char data[];
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", tokenUrl, "", 5000, data, result, resultHeaders);
   
   if(res != 200) {
      Print("Failed to fetch token from Dashboard. Code: ", res);
      return "";
   }
   
   string response = CharArrayToString(result);
   string token = ExtractJsonString(response, "token");
   
   if(token == "") {
      Print("Token not found in Dashboard response");
      return "";
   }
   
   return token;
}

//+------------------------------------------------------------------+

