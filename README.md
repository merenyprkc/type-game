# Typra

Monkeytype ilhamıyla geliştirilmiş, Türkçe ve İngilizce destekli modern yazı hızı ve doğruluk ölçüm uygulaması. Gerçek zamanlı analitik, kişisel geçmiş, global liderboard ve çok daha fazlası.

## Özellikler

### Oyun Modları
- **Süre** — 15 / 30 / 60 / 120 saniye
- **Kelime** — 10 / 25 / 50 / 100 kelime
- **Alıntı** — ZenQuotes API + seçilmiş Türkçe alıntılar
- **Kod** — JavaScript, TypeScript, Python, CSS snippet'ları
- **Zayıf Nokta Antrenmanı** — son 10 oyuna göre en çok hata yapılan tuşlara odaklanan otomatik alıştırma modu
- **Özel Metin** — yapıştırılan metinle serbest test

### Analitik
- Canlı WPM, Ham WPM ve doğruluk hesabı
- Tuş başına hata takibi ve parmak performansı
- Klavye ısı haritası (TR Q ve EN QWERTY düzeni)
- Bigram hata haritası
- Zaman içinde WPM gelişim grafiği (Recharts)

### Kullanıcı & Sosyal
- Google ile giriş (Firebase Auth)
- Firestore'a otomatik sonuç kaydetme
- Gerçek zamanlı global liderboard
- Herkese açık profil sayfası (`/profile/:uid`)
- Rozet sistemi — "100 WPM Kulübü", "Hatasız 100 Kelime" ve daha fazlası
- Günlük streak ve görev sistemi

### Kişiselleştirme
- 5 hazır tema: Default, Dracula, Nord, Cyberpunk, Matrix
- **Özel Tema Editörü** — vurgu ve arka plan rengi serbestçe seçilebilir
- Mekanik klavye ses efektleri (açılıp kapatılabilir)
- TR / EN arayüz dili

### PWA
- Kurulabilir uygulama (Chrome/Edge adres çubuğundan "Yükle")
- Offline çalışma — TR modu internet olmadan da oynanabilir
- Google Fonts ve API yanıtları önbelleklenir

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| State | Zustand (persist middleware) |
| Routing | React Router DOM v7 |
| Auth & DB | Firebase v12 (Auth + Firestore) |
| Grafikler | Recharts |
| Animasyonlar | Framer Motion |
| PWA | vite-plugin-pwa + Workbox |
| Kelime API | Datamuse (EN), ZenQuotes (alıntı) |