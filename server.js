const { port } = require('./config');
const express = require('express');
require('./Database/db');
const app = express();
const userRouter = require('./Routers/Users');
const hospitalRouter = require('./Routers/Hospital');
const bloodBankRouter=require("./Routers/BloodBank");
const donationRouter = require('./Routers/BloodBag');
const orderRouter = require('./Routers/Order');
const bloodDriveRouter = require('./Routers/BloodDrive');
const argentCallRouter = require('./Routers/ArgentCall');
const errorController = require('./Helper/errorController');

app.use(express.json());

app.use(['/user', '/users'], userRouter);
app.use(['/hospital', '/hospitals'], hospitalRouter);
app.use(['/bloodBank', '/bloodBanks'], bloodBankRouter);
app.use(['/donate'], donationRouter);
app.use(['/order'], orderRouter);
app.use(['/bloodDrive'], bloodDriveRouter);
app.use(['/argentCall'], argentCallRouter);
app.use(errorController);

app.listen(port, () => {
  console.info(`Server Listening on port ${port}`);
});
