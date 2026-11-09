// GreenRoots Supabase Auth User Seeder
// Uses Supabase Admin API to create auth accounts matching demo accounts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required to seed auth users.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "demo1234";

const DEMO_USERS = [
  // Farmers (Phone OTP)
  { id: "farmer_1", phone: "+919812345670", role: "farmer", email: "farmer1@greenroots.test" },
  { id: "farmer_2", phone: "+919812345671", role: "farmer", email: "farmer2@greenroots.test" },
  { id: "farmer_3", phone: "+919812345672", role: "farmer", email: "farmer3@greenroots.test" },
  { id: "farmer_4", phone: "+919812345673", role: "farmer", email: "farmer4@greenroots.test" },
  { id: "farmer_5", phone: "+919812345674", role: "farmer", email: "farmer5@greenroots.test" },
  { id: "farmer_6", phone: "+919812345675", role: "farmer", email: "farmer6@greenroots.test" },
  { id: "farmer_7", phone: "+919812345676", role: "farmer", email: "farmer7@greenroots.test" },
  { id: "farmer_8", phone: "+919812345677", role: "farmer", email: "farmer8@greenroots.test" },
  { id: "farmer_9", phone: "+919812345678", role: "farmer", email: "farmer9@greenroots.test" },
  { id: "farmer_10", phone: "+919812345679", role: "farmer", email: "farmer10@greenroots.test" },
  { id: "farmer_11", phone: "+919812345680", role: "farmer", email: "farmer11@greenroots.test" },
  { id: "farmer_12", phone: "+919812345681", role: "farmer", email: "farmer12@greenroots.test" },
  // Buyers (Phone OTP)
  { id: "buyer_1", phone: "+919822334455", role: "buyer", email: "buyer@amittraders.example" },
  // Industries (Email + Password)
  { id: "industry_1", email: "procurement@panipatbiomass.example", role: "industry" },
  { id: "industry_2", email: "buy@haryanagreenfuels.example", role: "industry" },
  { id: "industry_3", email: "supply@ludhianaagro.example", role: "industry" },
  { id: "industry_4", email: "biomass@nashikpower.example", role: "industry" },
  { id: "industry_5", email: "info@rewaribio.example", role: "industry" },
  // Admin (Email + Password)
  { id: "admin_1", email: "admin@greenroots.example", role: "admin" },
];

async function seedAuthUsers() {
  console.log("Seeding GreenRoots demo auth users...");

  for (const user of DEMO_USERS) {
    try {
      const userPayload: any = {
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: user.role, seed_id: user.id },
      };

      if (user.phone) {
        userPayload.phone = user.phone;
        userPayload.phone_confirm = true;
      }

      const { data, error } = await supabase.auth.admin.createUser(userPayload);

      if (error) {
        if (error.message.includes("already registered")) {
          console.log(`[Auth Seed] User ${user.email || user.phone} already exists.`);
        } else {
          console.warn(`[Auth Seed Error] ${user.email || user.phone}:`, error.message);
        }
      } else {
        console.log(`[Auth Seed] Created user ${user.role}: ${user.email || user.phone} (UID: ${data.user?.id})`);
      }
    } catch (err) {
      console.error(`[Auth Seed Exception]`, err);
    }
  }

  console.log("Auth user seeding complete.");
}

seedAuthUsers();

