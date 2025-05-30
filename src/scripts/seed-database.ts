import { getDb } from "../lib/db";

async function seedDatabase() {
  const db = await getDb();

  console.log("🗑️  Veritabanı temizleniyor...");

  // Tüm tabloları temizle (foreign key constraints nedeniyle sıralı)
  await db.run("DELETE FROM policy_files");
  await db.run("DELETE FROM accounting");
  await db.run("DELETE FROM policies");
  await db.run("DELETE FROM customers");

  // Auto increment değerlerini sıfırla
  await db.run(
    "DELETE FROM sqlite_sequence WHERE name IN ('customers', 'policies', 'accounting', 'policy_files')"
  );

  console.log("✅ Veritabanı temizlendi");

  console.log("👥 Müşteriler ekleniyor...");

  // 10 örnek müşteri
  const customers = [
    {
      name: "Ahmet Yılmaz",
      tcNumber: "12345678901",
      email: "ahmet@example.com",
      phone: "0532 123 4567",
      address: "İstanbul, Kadıköy",
    },
    {
      name: "Fatma Kaya",
      tcNumber: "12345678902",
      email: "fatma@example.com",
      phone: "0533 234 5678",
      address: "Ankara, Çankaya",
    },
    {
      name: "Mehmet Demir",
      tcNumber: "12345678903",
      email: "mehmet@example.com",
      phone: "0534 345 6789",
      address: "İzmir, Karşıyaka",
    },
    {
      name: "Ayşe Şahin",
      tcNumber: "12345678904",
      email: "ayse@example.com",
      phone: "0535 456 7890",
      address: "Bursa, Nilüfer",
    },
    {
      name: "Mustafa Özkan",
      tcNumber: "12345678905",
      email: "mustafa@example.com",
      phone: "0536 567 8901",
      address: "Antalya, Muratpaşa",
    },
    {
      name: "Zeynep Arslan",
      tcNumber: "12345678906",
      email: "zeynep@example.com",
      phone: "0537 678 9012",
      address: "Adana, Seyhan",
    },
    {
      name: "Ali Çelik",
      tcNumber: "12345678907",
      email: "ali@example.com",
      phone: "0538 789 0123",
      address: "Gaziantep, Şahinbey",
    },
    {
      name: "Elif Yıldız",
      tcNumber: "12345678908",
      email: "elif@example.com",
      phone: "0539 890 1234",
      address: "Konya, Selçuklu",
    },
    {
      name: "Emre Doğan",
      tcNumber: "12345678909",
      email: "emre@example.com",
      phone: "0540 901 2345",
      address: "Kayseri, Melikgazi",
    },
    {
      name: "Selin Aydın",
      tcNumber: "12345678910",
      email: "selin@example.com",
      phone: "0541 012 3456",
      address: "Mersin, Mezitli",
    },
  ];

  const customerIds = [];
  for (const customer of customers) {
    const result = await db.run(
      `INSERT INTO customers (name, tcNumber, email, phone, address, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        customer.name,
        customer.tcNumber,
        customer.email,
        customer.phone,
        customer.address,
      ]
    );
    customerIds.push(result.lastID);
  }

  console.log(`✅ ${customers.length} müşteri eklendi`);

  console.log("📋 Poliçeler ekleniyor...");

  // 12 örnek poliçe
  const policies = [
    {
      customerId: customerIds[0],
      policyNumber: "POL-2025-001",
      plateNumber: "34ABC123",
      policyType: "Kasko",
      premium: 2500,
      description: "Tam kasko sigortası",
    },
    {
      customerId: customerIds[0],
      policyNumber: "POL-2025-002",
      plateNumber: "34DEF456",
      policyType: "Trafik",
      premium: 800,
      description: "Zorunlu trafik sigortası",
    },
    {
      customerId: customerIds[1],
      policyNumber: "POL-2025-003",
      plateNumber: "06GHI789",
      policyType: "Kasko",
      premium: 3200,
      description: "Tam kasko sigortası",
    },
    {
      customerId: customerIds[2],
      policyNumber: "POL-2025-004",
      plateNumber: "35JKL012",
      policyType: "Trafik",
      premium: 750,
      description: "Zorunlu trafik sigortası",
    },
    {
      customerId: customerIds[3],
      policyNumber: "POL-2025-005",
      plateNumber: "16MNO345",
      policyType: "Dask",
      premium: 1200,
      description: "DASK deprem sigortası",
    },
    {
      customerId: customerIds[4],
      policyNumber: "POL-2025-006",
      plateNumber: "07PQR678",
      policyType: "Kasko",
      premium: 2800,
      description: "Tam kasko sigortası",
    },
    {
      customerId: customerIds[5],
      policyNumber: "POL-2025-007",
      plateNumber: "01STU901",
      policyType: "Sağlık",
      premium: 1500,
      description: "Tamamlayıcı sağlık sigortası",
    },
    {
      customerId: customerIds[6],
      policyNumber: "POL-2025-008",
      plateNumber: "27VWX234",
      policyType: "Kasko",
      premium: 3500,
      description: "Tam kasko sigortası",
    },
    {
      customerId: customerIds[7],
      policyNumber: "POL-2025-009",
      plateNumber: "42YZA567",
      policyType: "Trafik",
      premium: 900,
      description: "Zorunlu trafik sigortası",
    },
    {
      customerId: customerIds[8],
      policyNumber: "POL-2025-010",
      plateNumber: "38BCD890",
      policyType: "Yangın",
      premium: 1800,
      description: "Konut yangın sigortası",
    },
    {
      customerId: customerIds[9],
      policyNumber: "POL-2025-011",
      plateNumber: "33EFG123",
      policyType: "Kasko",
      premium: 2200,
      description: "Tam kasko sigortası",
    },
    {
      customerId: customerIds[9],
      policyNumber: "POL-2025-012",
      plateNumber: "33HIJ456",
      policyType: "Trafik",
      premium: 850,
      description: "Zorunlu trafik sigortası",
    },
  ];

  const policyIds = [];
  for (const policy of policies) {
    const customer = customers[customerIds.indexOf(policy.customerId)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90)); // Son 3 ay içinde başlamış
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 yıl sonra bitiyor

    const result = await db.run(
      `INSERT INTO policies (customerId, customerName, tcNumber, policyNumber, plateNumber, 
                           startDate, endDate, premium, status, policyType, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policy.customerId,
        customer.name,
        customer.tcNumber,
        policy.policyNumber,
        policy.plateNumber,
        startDate.toISOString(),
        endDate.toISOString(),
        policy.premium,
        "Aktif",
        policy.policyType,
        policy.description,
      ]
    );
    policyIds.push(result.lastID);
  }

  console.log(`✅ ${policies.length} poliçe eklendi`);

  console.log("💰 Muhasebe kayıtları ekleniyor...");

  // Her poliçe için 1-3 muhasebe kaydı
  let accountingCount = 0;
  for (let i = 0; i < policyIds.length; i++) {
    const policy = policies[i];
    const recordCount = Math.floor(Math.random() * 3) + 1; // 1-3 kayıt

    for (let j = 0; j < recordCount; j++) {
      const isIncome = Math.random() > 0.3; // %70 gelir, %30 gider
      const amount = isIncome
        ? Math.floor(Math.random() * 2000) + 500 // 500-2500 TL gelir
        : Math.floor(Math.random() * 800) + 100; // 100-900 TL gider

      const transactionDate = new Date();
      transactionDate.setDate(
        transactionDate.getDate() - Math.floor(Math.random() * 60)
      ); // Son 2 ay içinde

      const descriptions = isIncome
        ? [
            "Prim tahsilatı",
            "Ek prim ödemesi",
            "Gecikme faizi tahsilatı",
            "Komisyon geliri",
          ]
        : [
            "Ekspertiz masrafı",
            "Dosya masrafı",
            "Komisyon gideri",
            "İdari gider",
          ];

      const description =
        descriptions[Math.floor(Math.random() * descriptions.length)];

      await db.run(
        `INSERT INTO accounting (customerId, plateNumber, transactionDate, amount, type, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          policy.customerId,
          policy.plateNumber,
          transactionDate.toISOString(),
          amount,
          isIncome ? "Gelir" : "Gider",
          description,
        ]
      );
      accountingCount++;
    }
  }

  console.log(`✅ ${accountingCount} muhasebe kaydı eklendi`);

  console.log("📎 Örnek dosyalar ekleniyor...");

  // Rastgele poliçelere örnek dosyalar ekle
  const sampleFiles = [
    { name: "police_fotokopisi.pdf", type: "application/pdf", size: 245678 },
    { name: "trafik_tescil.pdf", type: "application/pdf", size: 156789 },
    { name: "ehliyet_fotokopisi.jpg", type: "image/jpeg", size: 89456 },
    { name: "arac_fotograflari.zip", type: "application/zip", size: 567890 },
    { name: "kimlik_fotokopisi.pdf", type: "application/pdf", size: 123456 },
    { name: "muayene_raporu.pdf", type: "application/pdf", size: 234567 },
    { name: "hasar_fotograflari.jpg", type: "image/jpeg", size: 345678 },
    { name: "ekspertiz_raporu.pdf", type: "application/pdf", size: 456789 },
  ];

  let fileCount = 0;
  // İlk 8 poliçeye rastgele dosyalar ekle
  for (let i = 0; i < Math.min(8, policyIds.length); i++) {
    const policyId = policyIds[i];
    const fileCount2 = Math.floor(Math.random() * 3) + 1; // 1-3 dosya

    for (let j = 0; j < fileCount2; j++) {
      const file = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
      const uniqueName = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}_${file.name}`;

      await db.run(
        `INSERT INTO policy_files (policyId, name, url, type, size, createdAt) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [policyId, file.name, `/uploads/${uniqueName}`, file.type, file.size]
      );
      fileCount++;
    }
  }

  console.log(`✅ ${fileCount} örnek dosya kaydı eklendi`);

  console.log("\n🎉 Veritabanı başarıyla seed edildi!");
  console.log(`📊 Özet:`);
  console.log(`   • ${customers.length} müşteri`);
  console.log(`   • ${policies.length} poliçe`);
  console.log(`   • ${accountingCount} muhasebe kaydı`);
  console.log(`   • ${fileCount} dosya kaydı`);
}

// Script'i çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seed işlemi tamamlandı");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed işlemi hatası:", error);
      process.exit(1);
    });
}

export { seedDatabase };
