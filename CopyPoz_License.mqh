//+------------------------------------------------------------------+
//|                                             CopyPoz_License.mqh |
//|                                                   Copyright 2026 |
//|                                         License Management System |
//+------------------------------------------------------------------+

#ifndef __COPYPOZ_LICENSE_MQH__
#define __COPYPOZ_LICENSE_MQH__

//--- Lisans Türleri
enum ENUM_LICENSE_TYPE
  {
   LICENSE_TRIAL = 0,      // Trial (30 gün)
   LICENSE_PRO = 1,        // Pro (1 yıl)
   LICENSE_ENTERPRISE = 2  // Enterprise (Unlimited)
  };

//--- Lisans Yapısı
struct LicenseInfo
  {
   ENUM_LICENSE_TYPE type;
   string key;
   datetime issued_date;
   datetime expiry_date;
   bool is_valid;
   bool is_expired;
   int days_left;
   string error_message;
  };

//--- Lisans Sabitleri
#define LICENSE_TRIAL_DAYS 30
#define LICENSE_PRO_DAYS 365
#define LICENSE_ENTERPRISE_DAYS 36500 // ~100 yıl

//--- Lisans Anahtarı Formatı: COPYPOZ-TYPE-YEAR-HASH
// Örnek: COPYPOZ-TRIAL-2026-A1B2C3D4E5F6
// Örnek: COPYPOZ-PRO-2026-X9Y8Z7W6V5U4
// Örnek: COPYPOZ-ENTERPRISE-2026-M1N2O3P4Q5R6

//+------------------------------------------------------------------+
//| Lisans Anahtarını Doğrula                                        |
//+------------------------------------------------------------------+
LicenseInfo ValidateLicense(string license_key)
  {
   LicenseInfo license;
   license.key = license_key;
   license.is_valid = false;
   license.is_expired = false;
   license.days_left = 0;
   license.error_message = "";
   
   // Boş key kontrolü
   if(license_key == "" || license_key == "DEMO")
     {
      license.type = LICENSE_TRIAL;
      license.issued_date = TimeCurrent();
      license.expiry_date = license.issued_date + (LICENSE_TRIAL_DAYS * 86400);
      license.is_valid = true;
      license.days_left = LICENSE_TRIAL_DAYS;
      return license;
     }
   
   // Format kontrolü: COPYPOZ-TYPE-YEAR-HASH
   string parts[];
   int count = StringSplit(license_key, '-', parts);
   
   if(count != 4)
     {
      license.error_message = "Invalid license format";
      return license;
     }
   
   // Prefix kontrolü
   if(parts[0] != "COPYPOZ")
     {
      license.error_message = "Invalid license prefix";
      return license;
     }
   
   // Lisans türü
   string type_str = parts[1];
   if(type_str == "TRIAL")
      license.type = LICENSE_TRIAL;
   else if(type_str == "PRO")
      license.type = LICENSE_PRO;
   else if(type_str == "ENTERPRISE")
      license.type = LICENSE_ENTERPRISE;
   else
     {
      license.error_message = "Invalid license type";
      return license;
     }
   
   // Yıl kontrolü
   int year = StringToInteger(parts[2]);
   int current_year = TimeYear(TimeCurrent());
   
   if(year < current_year)
     {
      license.error_message = "License year is in the past";
      license.is_expired = true;
      return license;
     }
   
   // Hash kontrolü (basit)
   string hash = parts[3];
   if(StringLen(hash) != 12)
     {
      license.error_message = "Invalid license hash";
      return license;
     }
   
   // Lisans tarihleri
   license.issued_date = TimeCurrent();
   
   if(license.type == LICENSE_TRIAL)
      license.expiry_date = license.issued_date + (LICENSE_TRIAL_DAYS * 86400);
   else if(license.type == LICENSE_PRO)
      license.expiry_date = license.issued_date + (LICENSE_PRO_DAYS * 86400);
   else
      license.expiry_date = license.issued_date + (LICENSE_ENTERPRISE_DAYS * 86400);
   
   // Süresi dolmuş mı kontrol et
   if(TimeCurrent() > license.expiry_date)
     {
      license.is_expired = true;
      license.error_message = "License expired";
      return license;
     }
   
   // Kalan gün sayısı
   license.days_left = (int)((license.expiry_date - TimeCurrent()) / 86400);
   
   license.is_valid = true;
   return license;
  }

//+------------------------------------------------------------------+
//| Lisans Türünü String'e Çevir                                     |
//+------------------------------------------------------------------+
string LicenseTypeToString(ENUM_LICENSE_TYPE type)
  {
   if(type == LICENSE_TRIAL)
      return "TRIAL";
   else if(type == LICENSE_PRO)
      return "PRO";
   else if(type == LICENSE_ENTERPRISE)
      return "ENTERPRISE";
   else
      return "UNKNOWN";
  }

//+------------------------------------------------------------------+
//| Lisans Bilgisini String'e Çevir                                  |
//+------------------------------------------------------------------+
string LicenseInfoToString(LicenseInfo license)
  {
   string info = "";
   info += "License Type: " + LicenseTypeToString(license.type) + "\n";
   info += "License Key: " + license.key + "\n";
   info += "Valid: " + (license.is_valid ? "Yes" : "No") + "\n";
   info += "Expired: " + (license.is_expired ? "Yes" : "No") + "\n";
   info += "Days Left: " + IntegerToString(license.days_left) + "\n";
   
   if(license.error_message != "")
      info += "Error: " + license.error_message + "\n";
   
   return info;
  }

//+------------------------------------------------------------------+
//| Lisans Türüne Göre Özellik Kontrolü                              |
//+------------------------------------------------------------------+
bool IsFeatureAllowed(ENUM_LICENSE_TYPE license_type, string feature)
  {
   // Trial: Temel özellikler
   if(license_type == LICENSE_TRIAL)
     {
      if(feature == "tcp_server") return true;
      if(feature == "position_sync") return true;
      if(feature == "web_api") return true;
      if(feature == "max_clients") return true; // 5 client
      return false;
     }
   
   // Pro: Tüm özellikler
   if(license_type == LICENSE_PRO)
     {
      return true;
     }
   
   // Enterprise: Tüm özellikler + sınırsız
   if(license_type == LICENSE_ENTERPRISE)
     {
      return true;
     }
   
   return false;
  }

//+------------------------------------------------------------------+
//| Maksimum Client Sayısı                                           |
//+------------------------------------------------------------------+
int GetMaxClients(ENUM_LICENSE_TYPE license_type)
  {
   if(license_type == LICENSE_TRIAL)
      return 5;      // Trial: 5 client
   else if(license_type == LICENSE_PRO)
      return 50;     // Pro: 50 client
   else
      return 1000;   // Enterprise: 1000 client
  }

//+------------------------------------------------------------------+
//| Lisans Kontrol Aralığı (Gün)                                     |
//+------------------------------------------------------------------+
int GetLicenseCheckInterval(ENUM_LICENSE_TYPE license_type)
  {
   // Ayda bir kontrol (30 gün)
   return 30;
  }

#endif
