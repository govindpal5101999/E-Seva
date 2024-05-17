const express = require('express');

const app = express();

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const server = require('http').createServer(app);

let bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const path =  require('path');

const multer = require('multer');

//Without Sequelize ---->
// const { Client } = require('pg');

//With Sequelize ----->
const sequelize = require('./db');
const connection = require('./models/User')(sequelize);
const img = require('./models/Images')(sequelize);
const secreteKey = 'Govind$123#54321';

var fileUpload = require('express-fileupload');




//Without Sequelize ----------->
// const connection = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'citrine',
//   password: 'Mgtech@123',
//   port: 5432,
// })
// connection.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected to the DB!");
// });


//With Sequelize ------------->
sequelize.sync().then(() => {
    console.log('connected!');
    server.listen(3000, () => console.log('Server is running on port 3000'))
})


//sign-up---->

app.get('/', (req, res) => {
    res.send('successfully logged')
})

// Register endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Username:', username);
        console.log('Password:', password);
        // const hashedPassword = await bcrypt.genSalt(10, (err, salt) =>{
        //     bcrypt.hash(`${password}`, salt, (err, hash) =>{
        //         if(err) throw(err)
        //     })
        // });

        const user = await connection.create({
            username: username,
            password: password
        });

        res.status(201).json({ message: 'User Created Successfully....!', user })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await connection.findOne({ where: { username: username } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // const isPasswordMatch = await bcrypt.compare(password, user.password);
        const isPasswordMatch = password;
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = jwt.sign({ userId: user.id }, secreteKey, { expiresIn: '2h' });
        res.json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = token.split(" ")[1];
        req.token = decoded;
        next();
       
    } catch (error) {
        
        res.status(401).json({ message: "Invalid Token" })
    }
}

// Protected route
app.get('/verifiedUser', authenticateToken, (req, res) => {

    jwt.verify(req.token, secreteKey, (err, result) =>{
        if(err){
            res.send({result: "Invalid Result"})
        }else{
            res.json({
                message: "Verified Successfully",
                result
            })
        }
    })
});

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, './upload_files')
    },
    filename: (req, file, cb)=>{
        return cb(null, Date.now() + '-' + file.originalname);
    }
}) // Store files in memory
const uploadDocs = multer({ storage: storage}).array('photos', 30); // Limit file size to 10MB

// Route for handling file uploads
app.post('/upload', authenticateToken, uploadDocs, async (req, res) => {
    
    const files = req.files;
    const entityId = req.body.entityId;
    if(!files){
        return res.status(400).send({message: "Please Upload Documents....!"})
    }
    jwt.verify(req.token, secreteKey, async (err, result) =>{
        if(err){
            res.send({result: "Invalid Result"})
        }else{
            try {   
                let imageArr;     
                await Promise.all(files.map(async (file) => {
                   imageArr = file;
                }));
                
                await img.create({ data: imageArr, entityId: entityId });
                return res.status(200).send({ message: "Documents Uploaded Successfully...!" });
            } catch (err) {
                return res.status(500).send({ message: "Internal Server Error" });
            }
        }
    })

});

//Fetch api for images -------->
// Express route to retrieve saved documents
app.get('/documents', authenticateToken ,async (req, res) => {

    jwt.verify(req.token, secreteKey, async (err, result) =>{
        if(err){
            res.send({result: "Invalid Result"})
        }else{
            try {
                // Find all documents associated with the logged-in user (or any other criteria)
                const documents = await img.findAll({   
                    result
                });
                
                // Send the retrieved documents as response
                return res.status(200).send(documents);
            } catch (err) {
                console.error('Error retrieving documents', err);
                return res.status(500).send({ message: "Internal Server Error" });
            }
        }
    })

});


