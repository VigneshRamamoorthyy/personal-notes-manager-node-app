const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const port = process.env.PORT || 3000; 

app.use(express.json())

const dbPath = path.join(__dirname, 'notes.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

const createTable = async () => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'Others',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.run(createTableQuery);
  };
  
  initializeDBAndServer().then(createTable);

//get notes api

  app.get('/notes/', async (request, response) => {
    const { category } = request.query;
  
    let notesQuery = 'SELECT * FROM notes';
    const params = [];
  
    if (category) {
      notesQuery += ' WHERE category = ?';
      params.push(category);
    }
  
    try {
      // Fetch notes based on the category filter
      const notes = await db.all(notesQuery, params);
      response.json(notes);
    } catch (error) {
      console.error(`Error fetching notes: ${error.message}`);
      response.status(500).send('Error fetching notes');
    }
  });
  
//add notes api

app.post('/notes/', async (request, response) => {
    const noteDetails = request.body;
 
    const { title, description, category } = noteDetails;

    // Insert note into the database
    const addNoteQuery = `
      INSERT INTO 
        notes (title, description, category) 
      VALUES (?, ?, ?)
    `;
  
    try {
      await db.run(addNoteQuery, [title, description, category]);
      response.send('Note Successfully Added');
    } catch (error) {
      console.error(`Error adding note: ${error.message}`);
      response.status(500).send('Error adding note');
    }
  });
  
  //update notes api

  app.put('/notes/:id', async (request, response) => {
    const { id } = request.params;
    const { title, description, category } = request.body;
  
    const updateNoteQuery = `
      UPDATE notes
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
  
    try {
      const result = await db.run(updateNoteQuery, [title, description, category, id]);
  
      // Check if a note was updated
      if (result.changes > 0) {
        response.send(`Note with ID ${id} updated successfully.`);
      } else {
        response.status(404).send(`Note with ID ${id} not found.`);
      }
    } catch (error) {
      console.error(`Error updating note: ${error.message}`);
      response.status(500).send('Error updating note');
    }
  });
  
  //delete notes api

  app.delete('/notes/:id', async (request, response) => {
    const { id } = request.params;
  
    const deleteNoteQuery = `
      DELETE FROM notes
      WHERE id = ?
    `;
  
    try {
      const result = await db.run(deleteNoteQuery, [id]);
      
      // Check if a note was deleted
      if (result.changes > 0) {
        response.send(`Note with ID ${id} deleted successfully.`);
      } else {
        response.status(404).send(`Note with ID ${id} not found.`);
      }
    } catch (error) {
      console.error(`Error deleting note: ${error.message}`);
      response.status(500).send('Error deleting note');
    }
  });


