#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZeroMQ Client - Ham Veri Dinleyici
Port 2000'den gelen tüm verileri ham halde gösterir
"""

import zmq
import json
import time
from datetime import datetime
import sys

def main():
    print("=" * 60)
    print("🔍 ZeroMQ Ham Veri Dinleyici")
    print("📍 Port: 2000")
    print("⏰ Başlatma Zamanı:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    print("📡 Bağlantı kuruluyor...")
    
    # ZeroMQ context oluştur
    context = zmq.Context()
    
    # SUB socket oluştur
    socket = context.socket(zmq.SUB)
    
    try:
        # Port 2000'e bağlan
        socket.connect("tcp://localhost:2000")
        
        # Tüm mesajları al (filtre yok)
        socket.setsockopt_string(zmq.SUBSCRIBE, "")
        
        print("✅ Bağlantı başarılı! Veriler dinleniyor...")
        print("💡 Çıkmak için Ctrl+C tuşlayın")
        print("-" * 60)
        
        message_count = 0
        
        while True:
            try:
                # Mesajı al
                message = socket.recv_string(flags=zmq.NOBLOCK)
                message_count += 1
                
                # Zaman damgası
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                print(f"\n📨 MESAJ #{message_count} - {timestamp}")
                print("=" * 50)
                
                # Ham veriyi göster
                print("🔍 HAM VERİ:")
                print(message)
                print("-" * 50)
                
                # JSON parse etmeye çalış
                try:
                    data = json.loads(message)
                    print("📋 JSON PARSE EDİLMİŞ:")
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                    
                    # Mesaj tipini vurgula
                    if 'type' in data:
                        msg_type = data['type']
                        if msg_type == 'positions_batch':
                            print("📦 POZİSYON TOPLU GÖNDERİM")
                            if 'total_positions' in data:
                                print(f"📊 Toplam Pozisyon: {data['total_positions']}")
                            if 'timestamp' in data:
                                dt = datetime.fromtimestamp(data['timestamp'])
                                print(f"⏰ Zaman: {dt.strftime('%H:%M:%S')}")
                            if 'positions' in data and isinstance(data['positions'], list):
                                print(f"📋 Pozisyon Listesi ({len(data['positions'])} adet):")
                                for i, pos in enumerate(data['positions'], 1):
                                    symbol = pos.get('symbol', 'N/A')
                                    cmd = pos.get('cmd', 0)
                                    volume = pos.get('volume', 0)
                                    ticket = pos.get('ticket', 0)
                                    magic = pos.get('magic', 0)
                                    cmd_str = "BUY" if cmd == 0 else "SELL"
                                    print(f"   {i}. {symbol} {cmd_str} {volume} lot (Ticket: {ticket}, Magic: {magic})")
                        elif msg_type == 'position_sync':
                            print("🔄 POZİSYON SENKRONİZASYONU")
                        elif msg_type == 'tp_update':
                            print("📈 TP GÜNCELLEMESİ")
                        elif msg_type == 'position_close':
                            print("🔴 POZİSYON KAPATMA")
                        elif msg_type == 'position_signal':
                            print("📊 POZİSYON SİNYALİ")
                        elif msg_type == 'sync_response':
                            print("🔄 SENKRONİZASYON YANITI")
                        elif msg_type == 'position_open':
                            print("🆕 YENİ POZİSYON AÇILDI")
                        else:
                            print(f"❓ BİLİNMEYEN TİP: {msg_type}")
                    
                except json.JSONDecodeError as e:
                    print(f"❌ JSON PARSE HATASI: {e}")
                    print("📝 Veri JSON formatında değil")
                
                print("=" * 50)
                
            except zmq.Again:
                # Mesaj yok, kısa bekle
                time.sleep(0.1)
                continue
                
    except KeyboardInterrupt:
        print("\n\n🛑 Kullanıcı tarafından durduruldu")
        print(f"📊 Toplam alınan mesaj: {message_count}")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        
    finally:
        # Temizlik
        socket.close()
        context.term()
        print("🔌 Bağlantı kapatıldı")
        print("👋 Çıkılıyor...")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"💥 Kritik hata: {e}")
        sys.exit(1) 