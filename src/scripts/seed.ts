import { getDb } from "@/lib/db";

async function seed() {
  const db = await getDb();

  // Mevcut verileri temizle
  console.log("Mevcut veriler temizleniyor...");
  await db.run("DELETE FROM accounting");
  await db.run("DELETE FROM policies");
  await db.run("DELETE FROM customers");

  // Müşterileri ekle
  const customers = [
    {
      name: "Ahmet Yılmaz",
      tcNumber: "12345678901",
      email: "ahmet.yilmaz@email.com",
      phone: "05551234567",
      address: "Atatürk Cad. No:123 Kadıköy/İstanbul",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Ayşe Demir",
      tcNumber: "23456789012",
      email: "ayse.demir@email.com",
      phone: "05552345678",
      address: "Bağdat Cad. No:456 Maltepe/İstanbul",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Mehmet Kaya",
      tcNumber: "34567890123",
      email: "mehmet.kaya@email.com",
      phone: "05553456789",
      address: "İstiklal Cad. No:789 Beyoğlu/İstanbul",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  console.log("Müşteriler ekleniyor...");
  for (const customer of customers) {
    await db.run(
      `INSERT INTO customers (name, tcNumber, email, phone, address, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.tcNumber,
        customer.email,
        customer.phone,
        customer.address,
        customer.createdAt,
        customer.updatedAt,
      ]
    );
  }

  // Poliçeleri ekle (referans için)
  const policies = [
    {
      policyNumber: "POL-2024-001",
      customerId: 1,
      customerName: "Ahmet Yılmaz",
      tcNumber: "12345678901",
      plateNumber: "34AA34",
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2025-01-01").toISOString(),
      premium: 5000,
      policyType: "Kasko",
      status: "Aktif",
      description: "Toyota Corolla 2020 Model",
    },
    {
      policyNumber: "POL-2024-002",
      customerId: 2,
      customerName: "Ayşe Demir",
      tcNumber: "23456789012",
      plateNumber: "42BB42",
      startDate: new Date("2024-02-01").toISOString(),
      endDate: new Date("2025-02-01").toISOString(),
      premium: 3000,
      policyType: "Trafik",
      status: "Aktif",
      description: "Honda Civic 2021 Model",
    },
    {
      policyNumber: "POL-2024-003",
      customerId: 3,
      customerName: "Mehmet Kaya",
      tcNumber: "34567890123",
      plateNumber: "06CC06",
      startDate: new Date("2024-03-01").toISOString(),
      endDate: new Date("2025-03-01").toISOString(),
      premium: 7500,
      policyType: "Konut",
      status: "Aktif",
      description: "3+1 Daire Kadıköy",
    },
  ];

  console.log("Poliçeler ekleniyor...");
  for (const policy of policies) {
    await db.run(
      `INSERT INTO policies (
        policyNumber, customerId, customerName, tcNumber, plateNumber, startDate, endDate,
        premium, policyType, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policy.policyNumber,
        policy.customerId,
        policy.customerName,
        policy.tcNumber,
        policy.plateNumber,
        policy.startDate,
        policy.endDate,
        policy.premium,
        policy.policyType,
        policy.status,
        policy.description,
      ]
    );
  }

  // Muhasebe kayıtlarını ekle (müşteri bazlı)
  const accountingRecords = [
    // Ahmet Yılmaz - 34AA34 plakalı araç
    {
      customerId: 1,
      plateNumber: "34AA34",
      transactionDate: new Date("2024-01-01").toISOString(),
      amount: 1000,
      type: "Gelir",
      description: "Kasko poliçesi peşin ödemesi",
    },
    {
      customerId: 1,
      plateNumber: "34AA34",
      transactionDate: new Date("2024-02-01").toISOString(),
      amount: 500,
      type: "Gider",
      description: "Ekspertiz ücreti",
    },
    // Ayşe Demir - 42BB42 plakalı araç
    {
      customerId: 2,
      plateNumber: "42BB42",
      transactionDate: new Date("2024-02-01").toISOString(),
      amount: 2000,
      type: "Gider",
      description: "Hasar ödemesi",
    },
    {
      customerId: 2,
      plateNumber: "42BB42",
      transactionDate: new Date("2024-03-01").toISOString(),
      amount: 1000,
      type: "Gider",
      description: "Ek ödeme",
    },
    // Mehmet Kaya - 06CC06 plakalı araç
    {
      customerId: 3,
      plateNumber: "06CC06",
      transactionDate: new Date("2024-03-01").toISOString(),
      amount: 1500,
      type: "Gelir",
      description: "Trafik poliçesi ödemesi",
    },
    // Mehmet Kaya - Plakasız (genel ödeme)
    {
      customerId: 3,
      plateNumber: null,
      transactionDate: new Date("2024-04-01").toISOString(),
      amount: 1500,
      type: "Gider",
      description: "Genel gider",
    },
  ];

  console.log("Muhasebe kayıtları ekleniyor...");
  for (const record of accountingRecords) {
    await db.run(
      `INSERT INTO accounting (
        customerId, plateNumber, transactionDate, amount, type, description
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.customerId,
        record.plateNumber,
        record.transactionDate,
        record.amount,
        record.type,
        record.description,
      ]
    );
  }

  console.log("Örnek veriler başarıyla eklendi!");
  console.log("\nÖrnek müşteri bakiyeleri:");
  console.log("- Ahmet Yılmaz (34AA34): +500 TL (1000 gelir - 500 gider)");
  console.log("- Ayşe Demir (42BB42): -3000 TL (0 gelir - 3000 gider)");
  console.log(
    "- Mehmet Kaya (06CC06): +1500 TL, Plakasız: -1500 TL, Toplam: 0 TL (deaktif)"
  );
}

seed().catch(console.error);
