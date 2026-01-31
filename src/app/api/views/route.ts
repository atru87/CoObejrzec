import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'movies.db');

export async function POST(request: NextRequest) {
  try {
    const { page } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const db = new Database(DB_PATH);
    
    // Utwórz tabelę jeśli nie istnieje
    db.exec(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page TEXT NOT NULL,
        ip TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        UNIQUE(page, ip)
      )
    `);
    
    // Dodaj wizytę (ignore duplicates)
    db.prepare(`
      INSERT OR IGNORE INTO page_views (page, ip, timestamp)
      VALUES (?, ?, ?)
    `).run(page, ip, Date.now());
    
    // Pobierz statystyki
    const total = db.prepare('SELECT COUNT(*) as count FROM page_views WHERE page = ?').get(page) as { count: number };
    
    db.close();
    
    return NextResponse.json({ views: total.count });
  } catch (error) {
    console.error('View counter error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get('page') || 'home';
    
    const db = new Database(DB_PATH);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM page_views WHERE page = ?').get(page) as { count: number } || { count: 0 };
    
    db.close();
    
    return NextResponse.json({ views: total.count });
  } catch (error) {
    return NextResponse.json({ views: 0 });
  }
}
