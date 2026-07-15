require("./config/loadEnv");
const createApp = require("./app");
const { ServerConfig } = require("./constants/enums");
const Logger = require("./utils/logger");
const { startAutoTradeJobs } = require("./jobs/autoTrade");

const app = createApp();
startAutoTradeJobs();
app.listen(ServerConfig.PORT, () => Logger.info(`listening to ${ServerConfig.PORT}`));
