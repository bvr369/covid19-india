const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertStatesObjectToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDbObjToResObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
const convertDbToStats = (dbObj) => {
  return {
    totalCases: dbObj.cases,
    totalCured: dbObj.cured,
    totalActive: dbObj.active,
    totalDeaths: dbObj.deaths,
  };
};
const convertDbStateNameToResObj = (dbObj) => {
  return {
    stateName: dbObj.state_name,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
    *
    FROM
    state;`;
  let statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((each) => convertStatesObjectToResponseObj(each))
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  let dbObject = await db.get(getStateQuery);
  response.send(convertStatesObjectToResponseObj(dbObject));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const { districtName, stateId, cases, active, deaths } = districtDetails;
  const updateDistrictQuery = `
  INSERT INTO
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES
  (
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );`;
  await db.run(updateDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictById = `
    SELECT 
    *
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  let dbObject = await db.get(getDistrictById);
  response.send(convertDbObjToResObj(dbObject));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const delDistrictQuery = `
    DELETE FROM
    district
    WHERE
    district_id = ${districtId};`;
  await db.run(delDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalStatsQuery = `
    SELECT
    SUM(cases) as cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths
    FROM
    district
    WHERE
    state_id = ${stateId};`;
  let dbObj = await db.get(getTotalStatsQuery);
  response.send(convertDbToStats(dbObj));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameBYId = `
    SELECT 
    state_name
    FROM
    state JOIN district
    WHERE
    district_id = ${districtId};`;
  let dbObj = await db.get(getStateNameBYId);
  response.send(convertDbStateNameToResObj(dbObj));
});
module.exports = app;
