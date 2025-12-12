// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// // PostgreSQL connection with enhanced configuration
// const sequelize = new Sequelize(
//   process.env.POSTGRES_DB || 'saajjewels',
//   process.env.POSTGRES_USER || 'postgres',
//   process.env.POSTGRES_PASSWORD || 'postgres',
//   {
//     host: process.env.POSTGRES_HOST || 'localhost',
//     port: process.env.POSTGRES_PORT || 5432,
//     dialect: 'postgres',
//     logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     },
//     // Add retry configuration
//     retry: {
//       max: 3
//     },
//     // Add connection timeout
//     dialectOptions: {
//       connectTimeout: 60000
//     }
//   }
// );

// // Test the connection
// const connectDB = async () => {
//   try {
//     console.log('Attempting to connect to PostgreSQL...');
//     console.log('Connection details:');
//     console.log('- Host:', process.env.POSTGRES_HOST || 'localhost');
//     console.log('- Port:', process.env.POSTGRES_PORT || 5432);
//     console.log('- Database:', process.env.POSTGRES_DB || 'saajjewels');
//     console.log('- User:', process.env.POSTGRES_USER || 'postgres');

//     await sequelize.authenticate();
//     console.log('PostgreSQL database connected successfully.');

//     // Sync all models - using force: false to prevent data loss
//     // In development, you might want to use { alter: true } but with caution
//     await sequelize.sync({ alter: false });
//     console.log('All models were synchronized successfully.');

//     return true;
//   } catch (error) {
//     console.error('Unable to connect to PostgreSQL database:', error.message);
//     // Log additional details for troubleshooting
//     if (error.parent) {
//       console.error('Database error details:', error.parent.message);
//     }

//     // Try to connect with fallback credentials
//     if (process.env.NODE_ENV === 'development') {
//       console.log('Trying fallback connection...');
//       const fallbackSequelize = new Sequelize('saajjewels', 'postgres', 'postgres', {
//         host: 'localhost',
//         port: 5432,
//         dialect: 'postgres',
//         logging: false,
//         pool: {
//           max: 5,
//           min: 0,
//           acquire: 30000,
//           idle: 10000
//         }
//       });

//       try {
//         await fallbackSequelize.authenticate();
//         console.log('Fallback connection successful!');
//         // Replace the main sequelize instance with the fallback
//         global.sequelize = fallbackSequelize;
//         return true;
//       } catch (fallbackError) {
//         console.error('Fallback connection also failed:', fallbackError.message);
//       }
//     }

//     return false;
//   }
// };

// module.exports = { sequelize, connectDB };

const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

// If Render provides a DATABASE_URL, use that
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for Render
      },
    },
  });

  console.log("Using Render DATABASE_URL...");
} else {
  // LOCAL DEVELOPMENT (fallback)
  sequelize = new Sequelize(
    process.env.POSTGRES_DB || "saajjewels",
    process.env.POSTGRES_USER || "postgres",
    process.env.POSTGRES_PASSWORD || "postgres",
    {
      host: process.env.POSTGRES_HOST || "localhost",
      port: process.env.POSTGRES_PORT || 5432,
      dialect: "postgres",
      logging: console.log,
    }
  );

  console.log("Using local PostgreSQL connection...");
}

const connectDB = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Sync tables (no destructive changes)
    await sequelize.sync({ alter: false });

    return true;
  } catch (error) {
    console.error("Database connection error:", error.message);
    return false;
  }
};

module.exports = { sequelize, connectDB };
