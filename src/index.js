const puppeteer = require('puppeteer');
const dayjs = require('dayjs')
const dotenv = require('dotenv')
dotenv.config();
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const oaklandHospitals = ['Highland and Fairmont Hospitals', 'Alameda Hospital', 'Sutter Health'];
const oaklandManagerAss = ['Vasquez,Angela', 'Odunikan,Kehinde', 'Lauderdale,LaRonda', 'Mulleague,Teresa',
  'Mathiesen,Desiree', 'Fabreo,Kristine', 'Thrower,Anetra', 'Davila,Marta', 'Mulleague,Teresa', 'Lopez,Cindyann']

const signInPage = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.extendedcare.com/professional/home/logon.aspx');

  await page.type('#UserNameTextBox', 'Shiy00');
  await page.type('#PasswordTextBox', 'Syx19881003@');

  await page.click('#ImageButton1');

  await page.waitForTimeout(5000);
  await page.click('#ctl15');
  await page.waitForTimeout(5000);
  console.log('----load table succeed----', dayjs().format());

  let data = {};
  const loadData = async (isInit) => {
    if (!isInit) {
      await page.reload();
      await page.waitForTimeout(5000);
      console.log('----reload table succeed----', dayjs().format());
    }

    const infos = await page.$$eval('table#ucViewGrid_dgView>tbody>tr>td:nth-child(3)', tds => tds.map((td) => {
      const cell = td.innerText.split('\n');
      return {referralId: cell[0], dateTime: cell[2]}
    }));
    const hospitalInfos = await page.$$eval('table#ucViewGrid_dgView>tbody>tr>td:nth-child(5)', tds => tds.map((td) => {
      const cell = td.innerText.split('\n');
      return {hospital: cell[1], managerAss: cell[2]};
    }));
    const insuranceInfos = await page.$$eval('table#ucViewGrid_dgView>tbody>tr>td:nth-child(6)', tds => tds.map((td) => {
      const cell = td.innerText.split('\n');
      return {insurance: cell[1]};
    }));

    for (let i = 1; i < infos.length; i++) {
      const {referralId, dateTime} = infos[i];
      const {hospital, managerAss} = hospitalInfos[i];
      const {insurance} = insuranceInfos[i];
      if (!data[referralId]) {
        data[referralId] = {
          referralId,
          dateTime,
          hospital,
          managerAss,
          insurance,
        }
        if (!isInit && (oaklandHospitals.indexOf(hospital) !== -1 || oaklandManagerAss.indexOf(managerAss) !== -1)) {
          // if (!isInit) {
          console.log('----send Jojo message', isInit, JSON.stringify(data[referralId]));
          await client.messages.create({
            to: '+15102775916',
            from: '+16106869019',
            body: JSON.stringify(data[referralId]),
          });
        }
      }
    }

    await page.waitForTimeout(1000 * 60 * 5);
    loadData(false);
  }

  loadData(true);
}

signInPage();
