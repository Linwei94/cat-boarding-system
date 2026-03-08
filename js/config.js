const { createClient } = window.supabase;
export const SUPABASE_URL = 'https://oybxjhsfyiqynpzauhff.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YnhqaHNmeWlxeW5wemF1aGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzY3NDQsImV4cCI6MjA4ODQ1Mjc0NH0.Gj43NzQlAOJPpeXlRrzW6gjBQCiUmieqOpiATeIG5XA';
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
