import mongoose from 'mongoose';
import config from 'config';

const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  } catch (error) {
    console.log('Error insdied db.js');
    console.log(error.message);
    //exit with failure
    process.exit(1);
  }
};

export default connectDB;
