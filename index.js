const express = require(`express`);
const cors = require(`cors`);
const bodyParser = require(`body-parser`);
const {MongoClient} = require(`mongodb`);
require('dotenv').config();


const app = express();
app.use(cors());
app.use(bodyParser.json());

const connectToDatabase = async() => {
    try{
        const client = await MongoClient.connect(process.env.MONGO_URI);
        console.log("Connected to database");
        return client.db('mongodb');
    }catch(err){
        console.log(err);
        process.exit(1)    
    }
}

let database;

const startServer = async() => {
    database = await connectToDatabase();
    app.listen(process.env.PORT, () => {
        console.log(`The server is running on port ${process.env.PORT}`);
    })
}

startServer();

//VISUALIZZARE TUTTI GLI UTENTI
app.get('/utenti', async(req, res) => {
    if (!database) {
        return res.status(500).json({message: "Error connect to database"});
    }
    try{
        const result = await database.collection('users').find({}).toArray(); //RICORDATI l'await
        res.status(200).json(result); //RICORDATI che non serve lo status visto che vediamo già i libri
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error get users"});
    }
})




//CREARE UN NUOVO UTENTE
app.post('/utente', async(req, res) => { //RICORDATI di mettere res e req
    if(!database){
        return res.status(500).json({message: "Error connect to database"}); //RICORDATI IL return
    }
    try{
        const {nome, cognome, username, email, citta, dataregistrazione} = req.body;
        const result = await database.collection('users').insertOne({nome, cognome, username, email, citta, dataRegistrazione});
        res.status(201).json({message: "Utente creato"}); //RICORDATI di mettere il codice di stato 201
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error create users"})
    }
})



//VISUALIZZARE UTENTE SPECIFICO
app.get('/utente/:username', async(req, res) => {
    if(!database){
        return res.status(500).json({message: "Error connect to database"}); 
    }
    try{
        const usernameDaVisualizzare = req.params.username;
        const result = await database.collection('users').findOne({username: usernameDaVisualizzare});

        res.json(result);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error get user"});
    }
})


app.put('/utente/:username', async(req, res) => { //RICORDATI req e res
    if(!database){
        return res.status(500).json({message: "Error connect to database"}); //RICORDATI il return quando c'è l'if
    }
    try{
        const usernameDaModificare = req.params.username;
        const updateData = req.body;

        const result = await database.collection('users').updateOne({username: usernameDaModificare}, {$set: updateData}); //RICORDATI l'await e anche username: usernameDaModificare

        if(result.matchedCount === 0){
            return res.status(404).json({message: "Utente non trovato"}); //RICORDATI il return quando c'è l'if
        }
        res.status(200).json({message: "Utente modificato"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error update user"});
    }
})


//ELIMINARE UTENTE SPECIFICO
app.post('/utente/:username', async(req, res) => {
    if(!database){
        return res.status(500).json({message: "Error connect to database"});
    }
    try{
        const utenteDaEliminare = req.params.username;
        const result = await database.collection('users').deleteOne({username: utenteDaEliminare});

        if(result.deletedCount === 0){
            return res.status(404).json({message: "Utente non trovato"});
        }
        res.status(200).json({message: "Utente eliminato"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error delete user"});
    }
})



//VISUALIZZARE UTENTI CON QUERY STRING
app.get('/utenti/search', async(req, res) => { //RICORDATI di mettere lo / all'inizio
    if(!database){
        return res.status(500).json({message: "Error connect to database"});
    }
    try{
        const {nome, cognome, username, email, password, citta, dataInizio, dataFine, ordine} = req.query; //RICORDATI di NON mettere dataRegistrazione non essendo in nessun if

        let query = {}; //RICORDARI di definire query

        if(nome){
            query.nome = nome;
        }

        if(username){
            query.username = username;
        }

        if(email){
            query.email = email;
        }

        if(password){
            query.password = password;
        }

        if(citta){
            query.citta = citta;
        }

        if(dataInizio && dataFine){
            query.dataRegistrazione = {
                $gte: dataInizio,
                $lte: dataFine
            }
        }

        let queryResult = database.collection('users').find(query); //RICORDATI non ci va il findOne ma SOLO find e NON ci va l'await
        //visto che il queryResult viene riassegnato NON è const ma LET

        if(cognome){
            if(ordine === 'desc'){
                queryResult = queryResult.sort({cognome: -1}) //RICODATI query non ci va ma ci va queryResult
            }else{
                queryResult = queryResult.sort({cognome: 1}) //RICORDATI non mettere le virgolette
            }
        }

        const result = await queryResult.toArray(); //RICORDATI il toArray()

        if(!result.length){ //RICORDATI mettici il punto esclamativo
            return res.status(404).json({message: "Utente non trovato"})
        }
        res.status(200).json(result)
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error get users"});
    }
})