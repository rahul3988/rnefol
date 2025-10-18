// Database schema management utility
import { Pool } from 'pg'

export async function ensureSchema(pool: Pool) {
  // First, completely drop and recreate the products table to avoid any constraint issues
  await pool.query(`
    DROP TABLE IF EXISTS products CASCADE;
  `)
  
  // Create tables first
  await pool.query(`
    create table if not exists products (
      id serial primary key,
      title text not null,
      slug text,
      category text default '',
      price text default '',
      list_image text default '',
      description text default '',
      details jsonb default '{}'::jsonb,
      brand text default '',
      key_ingredients text default '',
      skin_type text default '',
      hair_type text default '',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create table if not exists users (
      id serial primary key,
      name text not null,
      email text unique not null,
      password text not null,
      phone text,
      address jsonb,
      profile_photo text,
      loyalty_points integer default 0,
      total_orders integer default 0,
      member_since timestamptz default now(),
      is_verified boolean default false,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create table if not exists videos (
      id serial primary key,
      title text not null,
      description text not null,
      video_url text not null,
      redirect_url text not null,
      price text not null,
      size text not null check (size in ('small', 'medium', 'large')),
      thumbnail_url text not null,
      video_type text not null default 'url' check (video_type in ('local', 'instagram', 'facebook', 'youtube', 'url')),
      is_active boolean default true,
      views integer default 0,
      likes integer default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create table if not exists product_images (
      id serial primary key,
      product_id integer not null references products(id) on delete cascade,
      url text not null,
      created_at timestamptz default now()
    );
    
    create table if not exists cart (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      product_id integer not null references products(id) on delete cascade,
      quantity integer not null default 1,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(user_id, product_id)
    );
    
    create table if not exists wishlist (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      product_id integer not null references products(id) on delete cascade,
      created_at timestamptz default now(),
      unique(user_id, product_id)
    );
    
    create table if not exists orders (
      id serial primary key,
      order_number text unique not null,
      customer_name text not null,
      customer_email text not null,
      shipping_address jsonb not null,
      items jsonb not null,
      subtotal numeric(12,2) not null,
      shipping numeric(12,2) not null default 0,
      tax numeric(12,2) not null default 0,
      total numeric(12,2) not null,
      status text not null default 'created',
      payment_method text,
      payment_type text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    -- Ensure updated_at trigger exists
    create or replace function set_updated_at()
    returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
    
    drop trigger if exists trg_products_updated_at on products;
    create trigger trg_products_updated_at before update on products
    for each row execute procedure set_updated_at();
    
    -- Real-time analytics tables
    create table if not exists page_views (
      id serial primary key,
      user_id integer,
      page varchar(500) not null,
      session_id varchar(255),
      user_agent text,
      referrer text,
      ip_address inet,
      timestamp timestamptz default now(),
      duration_seconds integer default 0
    );
    
    create index if not exists idx_page_views_user_id on page_views(user_id);
    create index if not exists idx_page_views_page on page_views(page);
    create index if not exists idx_page_views_timestamp on page_views(timestamp);
    create index if not exists idx_page_views_session_id on page_views(session_id);
    
    create table if not exists user_actions (
      id serial primary key,
      user_id integer,
      action varchar(100),
      action_data jsonb default '{}'::jsonb,
      page varchar(500),
      session_id varchar(255),
      timestamp timestamptz default now()
    );
    
    create index if not exists idx_user_actions_user_id on user_actions(user_id);
    create index if not exists idx_user_actions_timestamp on user_actions(timestamp);
    create index if not exists idx_user_actions_session_id on user_actions(session_id);
    
    create table if not exists live_sessions (
      id serial primary key,
      user_id integer,
      socket_id varchar(255) unique not null,
      session_id varchar(255) not null,
      last_activity timestamptz default now(),
      current_page varchar(500),
      is_active boolean default true,
      connected_at timestamptz default now(),
      user_agent text,
      ip_address inet
    );
    
    create index if not exists idx_live_sessions_user_id on live_sessions(user_id);
    create index if not exists idx_live_sessions_socket_id on live_sessions(socket_id);
    create index if not exists idx_live_sessions_session_id on live_sessions(session_id);
    create index if not exists idx_live_sessions_is_active on live_sessions(is_active);
    
    create table if not exists cart_events (
      id serial primary key,
      user_id integer,
      action varchar(50) not null,
      product_id integer,
      product_name text,
      quantity integer,
      price text,
      session_id varchar(255),
      timestamp timestamptz default now()
    );
    
    create index if not exists idx_cart_events_user_id on cart_events(user_id);
    create index if not exists idx_cart_events_timestamp on cart_events(timestamp);
    
    create table if not exists search_queries (
      id serial primary key,
      user_id integer,
      query text not null,
      results_count integer default 0,
      session_id varchar(255),
      timestamp timestamptz default now()
    );
    
    create index if not exists idx_search_queries_user_id on search_queries(user_id);
    create index if not exists idx_search_queries_timestamp on search_queries(timestamp);
    create index if not exists idx_search_queries_query on search_queries(query);
    
    -- Blog posts table for blog request system
    create table if not exists blog_posts (
      id serial primary key,
      title text not null,
      excerpt text not null,
      content text not null,
      author_name text not null,
      author_email text not null,
      images jsonb default '[]'::jsonb,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      featured boolean default false,
      rejection_reason text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create index if not exists idx_blog_posts_status on blog_posts(status);
    create index if not exists idx_blog_posts_featured on blog_posts(featured);
    create index if not exists idx_blog_posts_created_at on blog_posts(created_at);
    
    -- CMS pages table
    create table if not exists cms_pages (
      id serial primary key,
      slug text unique not null,
      title text not null,
      content jsonb default '{}'::jsonb,
      meta_description text,
      is_active boolean default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create index if not exists idx_cms_pages_slug on cms_pages(slug);
    create index if not exists idx_cms_pages_is_active on cms_pages(is_active);
    
    -- CMS sections table
    create table if not exists cms_sections (
      id serial primary key,
      page_id integer not null references cms_pages(id) on delete cascade,
      section_type text not null,
      title text,
      content jsonb default '{}'::jsonb,
      order_index integer default 0,
      is_active boolean default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create index if not exists idx_cms_sections_page_id on cms_sections(page_id);
    create index if not exists idx_cms_sections_order on cms_sections(order_index);
  `)
  
  // Add unique constraint on products slug
  await pool.query(`
    ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  `)
  
  // Add missing price column to cart_events table
  await pool.query(`
    ALTER TABLE cart_events 
    ADD COLUMN IF NOT EXISTS price text;
  `)
  
  // Migrate action_type to action in user_actions if needed
  await pool.query(`
    DO $$ 
    BEGIN
      -- Check if action_type column exists and action doesn't
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_actions' AND column_name = 'action_type'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_actions' AND column_name = 'action'
      ) THEN
        ALTER TABLE user_actions RENAME COLUMN action_type TO action;
      END IF;
      
      -- Add action column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_actions' AND column_name = 'action'
      ) THEN
        ALTER TABLE user_actions ADD COLUMN action varchar(100);
      END IF;
    END $$;
  `)
  
  // Create index on action column after migration
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
  `)
}