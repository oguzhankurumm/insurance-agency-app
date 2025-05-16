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
      email: "ahmet.yilmaz@email.com",
      phone: "05551234567",
      address: "Atatürk Cad. No:123 Kadıköy/İstanbul",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Ayşe Demir",
      email: "ayse.demir@email.com",
      phone: "05552345678",
      address: "Bağdat Cad. No:456 Maltepe/İstanbul",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Mehmet Kaya",
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
      `INSERT INTO customers (name, email, phone, address, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.createdAt,
        customer.updatedAt,
      ]
    );
  }

  // Poliçeleri ekle
  const policies = [
    {
      policyNumber: "POL-2024-001",
      customerId: 1,
      customerName: "Ahmet Yılmaz",
      tcNumber: "12345678901",
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
        policyNumber, customerId, customerName, tcNumber, startDate, endDate,
        premium, policyType, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policy.policyNumber,
        policy.customerId,
        policy.customerName,
        policy.tcNumber,
        policy.startDate,
        policy.endDate,
        policy.premium,
        policy.policyType,
        policy.status,
        policy.description,
      ]
    );
  }

  // Muhasebe kayıtlarını ekle
  const accountingRecords = [
    {
      policyId: 1,
      transactionDate: new Date("2024-01-01").toISOString(),
      amount: 5000,
      type: "Gelir",
      description: "Kasko poliçesi ödemesi",
    },
    {
      policyId: 2,
      transactionDate: new Date("2024-02-01").toISOString(),
      amount: 3000,
      type: "Gelir",
      description: "Trafik poliçesi ödemesi",
    },
    {
      policyId: 3,
      transactionDate: new Date("2024-03-01").toISOString(),
      amount: 7500,
      type: "Gelir",
      description: "Konut poliçesi ödemesi",
    },
  ];

  console.log("Muhasebe kayıtları ekleniyor...");
  for (const record of accountingRecords) {
    await db.run(
      `INSERT INTO accounting (
        policyId, transactionDate, amount, type, description
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        record.policyId,
        record.transactionDate,
        record.amount,
        record.type,
        record.description,
      ]
    );
  }

  console.log("Örnek veriler başarıyla eklendi!");
}

seed().catch(console.error);
