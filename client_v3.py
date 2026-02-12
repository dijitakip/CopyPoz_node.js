import zmq
import json
import os
import sys
import time
from datetime import datetime

# Konsol temizleme fonksiyonu
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

# Tablo yazdırma fonksiyonu (prettytable varsa kullan, yoksa manuel)
def print_table(positions):
    try:
        from prettytable import PrettyTable
        table = PrettyTable()
        table.field_names = ["Ticket", "Symbol", "Type", "Vol", "Price", "SL", "TP", "Magic", "Profit", "Comment"]
        table.align = "l"  # Sola hizala
        
        for pos in positions:
            p_type = "BUY" if pos.get('type') == 0 else "SELL"
            table.add_row([
                pos.get('ticket'),
                pos.get('symbol'),
                p_type,
                f"{pos.get('volume'):.2f}",
                f"{pos.get('price'):.5f}",
                f"{pos.get('sl'):.5f}",
                f"{pos.get('tp'):.5f}",
                pos.get('magic'),
                f"{pos.get('profit'):.2f}",
                pos.get('comment', '')
            ])
        print(table)
    except ImportError:
        # Manuel formatlama
        print(f"{'TICKET':<10} {'SYMBOL':<10} {'TYPE':<5} {'VOL':<6} {'PRICE':<10} {'SL':<10} {'TP':<10} {'PROFIT':<10}")
        print("-" * 80)
        for pos in positions:
            p_type = "BUY" if pos.get('type') == 0 else "SELL"
            print(f"{pos.get('ticket'):<10} {pos.get('symbol'):<10} {p_type:<5} {pos.get('volume'):<6.2f} {pos.get('price'):<10.5f} {pos.get('sl'):<10.5f} {pos.get('tp'):<10.5f} {pos.get('profit'):<10.2f}")

def main():
    print("CopyPoz V3 Client Başlatılıyor...")
    print("ZMQ Kütüphanesi Yükleniyor...")
    
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    
    # Master Adresi (Varsayılan: localhost:2000)
    address = "tcp://localhost:2000"
    if len(sys.argv) > 1:
        address = sys.argv[1]
        
    print(f"Bağlanılıyor: {address}")
    socket.connect(address)
    socket.setsockopt_string(zmq.SUBSCRIBE, "")
    
    print("Bağlantı Başarılı! Veri bekleniyor...")
    
    last_update = datetime.now()
    
    try:
        while True:
            # Mesajı al
            msg = socket.recv_string()
            
            try:
                data = json.loads(msg)
                
                # Sadece POSITIONS_BROADCAST mesajlarını işle
                if data.get('type') == 'POSITIONS_BROADCAST':
                    clear_screen()
                    print(f"--- CopyPoz V3 Master İzleme ---")
                    print(f"Son Güncelleme: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
                    print(f"Master Zamanı: {data.get('timestamp')}")
                    print(f"Toplam Pozisyon: {len(data.get('positions', []))}")
                    print("")
                    
                    if 'positions' in data and len(data['positions']) > 0:
                        print_table(data['positions'])
                    else:
                        print(">> AÇIK POZİSYON YOK <<")
                        
                    print("\nÇıkış için Ctrl+C")
                    
            except json.JSONDecodeError:
                print("HATA: Geçersiz JSON formatı")
            except Exception as e:
                print(f"HATA: {e}")
                
    except KeyboardInterrupt:
        print("\nİzleme sonlandırıldı.")
    finally:
        socket.close()
        context.term()

if __name__ == "__main__":
    main()
