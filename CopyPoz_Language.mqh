//+------------------------------------------------------------------+
//|                                            CopyPoz_Language.mqh |
//|                                                   Copyright 2026 |
//|                                    Multi-Language Support System |
//+------------------------------------------------------------------+

#ifndef __COPYPOZ_LANGUAGE_MQH__
#define __COPYPOZ_LANGUAGE_MQH__

//--- Desteklenen Diller
enum ENUM_LANGUAGE
  {
   LANG_TR = 0,  // Türkçe
   LANG_EN = 1   // English
  };

//--- Dil Yapısı
struct LanguageStrings
  {
   // Başlangıç Mesajları
   string msg_starting;
   string msg_started;
   string msg_stopping;
   string msg_stopped;
   
   // TCP Mesajları
   string msg_tcp_socket_created;
   string msg_tcp_socket_error;
   string msg_tcp_bind_error;
   string msg_tcp_listen_error;
   string msg_tcp_nonblocking_error;
   string msg_tcp_client_connected;
   string msg_tcp_client_disconnected;
   string msg_tcp_client_timeout;
   string msg_tcp_send_error;
   string msg_tcp_accept_error;
   
   // Lisans Mesajları
   string msg_license_invalid;
   string msg_license_expired;
   string msg_license_valid;
   string msg_license_checking;
   string msg_license_check_failed;
   string msg_license_trial_days_left;
   string msg_license_trial_expired;
   
   // Pozisyon Mesajları
   string msg_broadcast_positions;
   string msg_no_clients;
   string msg_no_positions;
   string msg_position_count;
   
   // Web API Mesajları
   string msg_web_api_sending;
   string msg_web_api_success;
   string msg_web_api_error;
   string msg_web_api_timeout;
   
   // Komut Mesajları
   string msg_command_pause;
   string msg_command_resume;
   string msg_command_close_all;
   string msg_command_close_buy;
   string msg_command_close_sell;
   string msg_command_unknown;
   string msg_broadcast_paused;
   string msg_broadcast_resumed;
   
   // Hata Mesajları
   string msg_error_socket_creation;
   string msg_error_socket_bind;
   string msg_error_socket_listen;
   string msg_error_socket_accept;
   string msg_error_socket_send;
   string msg_error_socket_close;
   string msg_error_license_invalid;
   string msg_error_license_expired;
   string msg_error_web_api;
   
   // Bilgi Mesajları
   string msg_info_total_clients;
   string msg_info_total_positions;
   string msg_info_broadcast_interval;
   string msg_info_web_api_interval;
   string msg_info_license_type;
   string msg_info_license_expiry;
  };

//--- Türkçe Dil Paketi
LanguageStrings GetLanguageTR()
  {
   LanguageStrings lang;
   
   // Başlangıç Mesajları
   lang.msg_starting = "--- Master EA V5 Başlatılıyor ---";
   lang.msg_started = "Master EA V5 Başarıyla Başlatıldı";
   lang.msg_stopping = "--- Master EA V5 Sonlandırılıyor ---";
   lang.msg_stopped = "Master EA V5 Sonlandırıldı";
   
   // TCP Mesajları
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
   
   // Lisans Mesajları
   lang.msg_license_invalid = "HATA: Geçersiz lisans anahtarı";
   lang.msg_license_expired = "HATA: Lisans süresi dolmuş";
   lang.msg_license_valid = "Lisans geçerli";
   lang.msg_license_checking = "Lisans kontrol ediliyor";
   lang.msg_license_check_failed = "HATA: Lisans kontrol başarısız";
   lang.msg_license_trial_days_left = "Trial süresi kalan gün";
   lang.msg_license_trial_expired = "HATA: Trial süresi dolmuş";
   
   // Pozisyon Mesajları
   lang.msg_broadcast_positions = "Pozisyon yayını";
   lang.msg_no_clients = "Hiç client yok";
   lang.msg_no_positions = "Hiç pozisyon yok";
   lang.msg_position_count = "Pozisyon sayısı";
   
   // Web API Mesajları
   lang.msg_web_api_sending = "Web API'ye gönderiliyor";
   lang.msg_web_api_success = "Web API Başarılı";
   lang.msg_web_api_error = "Web API Hatası";
   lang.msg_web_api_timeout = "Web API Timeout";
   
   // Komut Mesajları
   lang.msg_command_pause = "Kopyalama DURDURULDU";
   lang.msg_command_resume = "Kopyalama DEVAM ETTİRİLDİ";
   lang.msg_command_close_all = "Tüm pozisyonlar kapatılıyor";
   lang.msg_command_close_buy = "Tüm BUY pozisyonları kapatılıyor";
   lang.msg_command_close_sell = "Tüm SELL pozisyonları kapatılıyor";
   lang.msg_command_unknown = "Bilinmeyen komut";
   lang.msg_broadcast_paused = "Pozisyon yayını DURDURULDU";
   lang.msg_broadcast_resumed = "Pozisyon yayını DEVAM ETTİRİLDİ";
   
   // Hata Mesajları
   lang.msg_error_socket_creation = "Socket oluşturma hatası";
   lang.msg_error_socket_bind = "Socket bind hatası";
   lang.msg_error_socket_listen = "Socket listen hatası";
   lang.msg_error_socket_accept = "Socket accept hatası";
   lang.msg_error_socket_send = "Socket send hatası";
   lang.msg_error_socket_close = "Socket close hatası";
   lang.msg_error_license_invalid = "Geçersiz lisans";
   lang.msg_error_license_expired = "Lisans süresi dolmuş";
   lang.msg_error_web_api = "Web API hatası";
   
   // Bilgi Mesajları
   lang.msg_info_total_clients = "Toplam client";
   lang.msg_info_total_positions = "Toplam pozisyon";
   lang.msg_info_broadcast_interval = "Yayın aralığı";
   lang.msg_info_web_api_interval = "Web API aralığı";
   lang.msg_info_license_type = "Lisans türü";
   lang.msg_info_license_expiry = "Lisans sona erme tarihi";
   
   return lang;
  }

//--- English Dil Paketi
LanguageStrings GetLanguageEN()
  {
   LanguageStrings lang;
   
   // Starting Messages
   lang.msg_starting = "--- Master EA V5 Starting ---";
   lang.msg_started = "Master EA V5 Started Successfully";
   lang.msg_stopping = "--- Master EA V5 Stopping ---";
   lang.msg_stopped = "Master EA V5 Stopped";
   
   // TCP Messages
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
   
   // License Messages
   lang.msg_license_invalid = "ERROR: Invalid license key";
   lang.msg_license_expired = "ERROR: License expired";
   lang.msg_license_valid = "License valid";
   lang.msg_license_checking = "Checking license";
   lang.msg_license_check_failed = "ERROR: License check failed";
   lang.msg_license_trial_days_left = "Trial days left";
   lang.msg_license_trial_expired = "ERROR: Trial period expired";
   
   // Position Messages
   lang.msg_broadcast_positions = "Broadcasting positions";
   lang.msg_no_clients = "No clients connected";
   lang.msg_no_positions = "No positions open";
   lang.msg_position_count = "Position count";
   
   // Web API Messages
   lang.msg_web_api_sending = "Sending to Web API";
   lang.msg_web_api_success = "Web API Success";
   lang.msg_web_api_error = "Web API Error";
   lang.msg_web_api_timeout = "Web API Timeout";
   
   // Command Messages
   lang.msg_command_pause = "Copying PAUSED";
   lang.msg_command_resume = "Copying RESUMED";
   lang.msg_command_close_all = "Closing all positions";
   lang.msg_command_close_buy = "Closing all BUY positions";
   lang.msg_command_close_sell = "Closing all SELL positions";
   lang.msg_command_unknown = "Unknown command";
   lang.msg_broadcast_paused = "Position broadcast PAUSED";
   lang.msg_broadcast_resumed = "Position broadcast RESUMED";
   
   // Error Messages
   lang.msg_error_socket_creation = "Socket creation error";
   lang.msg_error_socket_bind = "Socket bind error";
   lang.msg_error_socket_listen = "Socket listen error";
   lang.msg_error_socket_accept = "Socket accept error";
   lang.msg_error_socket_send = "Socket send error";
   lang.msg_error_socket_close = "Socket close error";
   lang.msg_error_license_invalid = "Invalid license";
   lang.msg_error_license_expired = "License expired";
   lang.msg_error_web_api = "Web API error";
   
   // Info Messages
   lang.msg_info_total_clients = "Total clients";
   lang.msg_info_total_positions = "Total positions";
   lang.msg_info_broadcast_interval = "Broadcast interval";
   lang.msg_info_web_api_interval = "Web API interval";
   lang.msg_info_license_type = "License type";
   lang.msg_info_license_expiry = "License expiry date";
   
   return lang;
  }

//--- Dil Seçici
LanguageStrings GetLanguage(ENUM_LANGUAGE lang_type)
  {
   if(lang_type == LANG_EN)
      return GetLanguageEN();
   else
      return GetLanguageTR(); // Varsayılan: Türkçe
  }

#endif
