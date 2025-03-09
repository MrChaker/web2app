use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
      Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "CREATE TABLE downloads (id INTEGER PRIMARY KEY, file_name TEXT, file_size REAL, url TEXT, output_path TEXT, progress REAL);",
        kind: MigrationKind::Up,
      },
      Migration {
          version: 2,
          description: "change_id_downloads_tables",
          sql: "DROP TABLE IF EXISTS downloads; CREATE TABLE downloads (id INTEGER PRIMARY KEY AUTOINCREMENT, file_name TEXT, file_size REAL, url TEXT, output_path TEXT, progress REAL);",
          kind: MigrationKind::Up,
      },
      Migration {
          version: 3,
          description: "add_created_at_column",
          sql: "ALTER TABLE downloads ADD COLUMN created_at DATETIME DEFAULT NULL;",
          kind: MigrationKind::Up,
      },
        Migration {
          version: 4,
          description: "add_state_column",
          sql: "ALTER TABLE downloads ADD COLUMN state TEXT DEFAULT starting;",
          kind: MigrationKind::Up,
      },
      Migration {
        version: 5,
        description: "license_key",
        sql: "CREATE TABLE license_key (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT);",
        kind: MigrationKind::Up,
      },
    ]
}
