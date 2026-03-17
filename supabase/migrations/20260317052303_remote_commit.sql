


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."boardings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cat_id" "uuid",
    "owner_id" "uuid",
    "room_type_id" "uuid",
    "check_in_date" "date" NOT NULL,
    "check_out_date" "date" NOT NULL,
    "daily_rate" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "boardings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."boardings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "breed" "text",
    "age" "text",
    "gender" "text" DEFAULT 'unknown'::"text",
    "color" "text",
    "special_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cats_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."cats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_visit_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "home_visit_id" "uuid",
    "visit_date" "date" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."home_visit_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "cat_id" "uuid",
    "address" "text" NOT NULL,
    "visit_time" "text",
    "price_per_visit" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "home_visits_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."home_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_room_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "room_type_id" "uuid",
    "price_per_day" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."owner_room_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "address" "text",
    "discount_rate" numeric(5,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "wechat" "text",
    CONSTRAINT "owners_discount_rate_check" CHECK ((("discount_rate" >= (0)::numeric) AND ("discount_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_per_day" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."room_types" OWNER TO "postgres";


ALTER TABLE ONLY "public"."boardings"
    ADD CONSTRAINT "boardings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cats"
    ADD CONSTRAINT "cats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_visit_dates"
    ADD CONSTRAINT "home_visit_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_visits"
    ADD CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_room_prices"
    ADD CONSTRAINT "owner_room_prices_owner_id_room_type_id_key" UNIQUE ("owner_id", "room_type_id");



ALTER TABLE ONLY "public"."owner_room_prices"
    ADD CONSTRAINT "owner_room_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_types"
    ADD CONSTRAINT "room_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."boardings"
    ADD CONSTRAINT "boardings_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."boardings"
    ADD CONSTRAINT "boardings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."boardings"
    ADD CONSTRAINT "boardings_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cats"
    ADD CONSTRAINT "cats_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."home_visit_dates"
    ADD CONSTRAINT "home_visit_dates_home_visit_id_fkey" FOREIGN KEY ("home_visit_id") REFERENCES "public"."home_visits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."home_visits"
    ADD CONSTRAINT "home_visits_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."home_visits"
    ADD CONSTRAINT "home_visits_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_room_prices"
    ADD CONSTRAINT "owner_room_prices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_room_prices"
    ADD CONSTRAINT "owner_room_prices_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE CASCADE;



CREATE POLICY "auth_boardings" ON "public"."boardings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_cats" ON "public"."cats" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_home_visit_dates" ON "public"."home_visit_dates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_home_visits" ON "public"."home_visits" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_owner_room_prices" ON "public"."owner_room_prices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_owners" ON "public"."owners" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_room_types" ON "public"."room_types" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."boardings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_visit_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owner_room_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_types" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."boardings" TO "anon";
GRANT ALL ON TABLE "public"."boardings" TO "authenticated";
GRANT ALL ON TABLE "public"."boardings" TO "service_role";



GRANT ALL ON TABLE "public"."cats" TO "anon";
GRANT ALL ON TABLE "public"."cats" TO "authenticated";
GRANT ALL ON TABLE "public"."cats" TO "service_role";



GRANT ALL ON TABLE "public"."home_visit_dates" TO "anon";
GRANT ALL ON TABLE "public"."home_visit_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."home_visit_dates" TO "service_role";



GRANT ALL ON TABLE "public"."home_visits" TO "anon";
GRANT ALL ON TABLE "public"."home_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."home_visits" TO "service_role";



GRANT ALL ON TABLE "public"."owner_room_prices" TO "anon";
GRANT ALL ON TABLE "public"."owner_room_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_room_prices" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."room_types" TO "anon";
GRANT ALL ON TABLE "public"."room_types" TO "authenticated";
GRANT ALL ON TABLE "public"."room_types" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































