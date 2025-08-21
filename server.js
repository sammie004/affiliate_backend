// dependencies
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes/routes');

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
  
app.use(cors());

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Affiliate Backend API',
      version: '1.0.0',
      description: 'API documentation for the Affiliate System',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`, // your server URL
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the route files for swagger-jsdoc to scan
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// testing route
app.get('/', (req, res) => {
  res.send(`This is just a testing route`);
});

// main routes
app.use('/api', routes);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
