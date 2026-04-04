async function testGetCurrentUser() {
  const baseUrl = "http://localhost:3000";
  const userEmail = `eko_current_${Date.now()}@gmail.com`;
  const password = "password123";

  console.log("1. Registering user...");
  const regRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Eko Current",
      email: userEmail,
      password: password,
    }),
  });
  console.log("Registration Status:", regRes.status);

  console.log("\n2. Logging in...");
  const loginRes = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userEmail,
      password: password,
    }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.data;
  console.log("Login Status:", loginRes.status);
  console.log("Token:", token);

  console.log("\n3. Getting Current User (Valid Token)...");
  console.log("\n3. Getting Current User (Valid Token)...");
  const currentValidRes = await fetch(`${baseUrl}/api/users/current`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const currentValidText = await currentValidRes.text();
  console.log("Status:", currentValidRes.status);
  try {
    const currentValidData = JSON.parse(currentValidText);
    console.log("Data:", JSON.stringify(currentValidData, null, 2));
  } catch (e) {
    console.error("Failed to parse JSON for currentValidRes");
    console.log("Raw Response:", currentValidText);
    return;
  }

  console.log("\n4. Getting Current User (Invalid Token)...");
  const currentInvalidRes = await fetch(`${baseUrl}/api/users/current`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer invalid-token"
    }
  });
  const currentInvalidData: any = await currentInvalidRes.json();
  console.log("Status:", currentInvalidRes.status);
  console.log("Data:", JSON.stringify(currentInvalidData, null, 2));

  console.log("\n5. Getting Current User (No Token)...");
  const currentNoRes = await fetch(`${baseUrl}/api/users/current`, {
    method: "GET"
  });
  const currentNoData: any = await currentNoRes.json();
  console.log("Status:", currentNoRes.status);
  console.log("Data:", JSON.stringify(currentNoData, null, 2));
}

testGetCurrentUser();
