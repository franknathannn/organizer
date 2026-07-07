const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ocephpgzidxwjfqjgosh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXBocGd6aWR4d2pmcWpnb3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDI2MjgsImV4cCI6MjA5ODk3ODYyOH0.8vxluvck-3TSt2FjnUesIugXb6xKw2-v_GLzAI5-DGY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkType() {
  const { data, error } = await supabase
    .from('planner_events')
    .insert({ title: 'dummy', event_date: '2026-07-07', event_time: '10:00-11:00' });
  console.log("INSERT ERROR:", error);
}

checkType();
