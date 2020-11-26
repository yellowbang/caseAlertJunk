const puppeteer = require('puppeteer');
const dayjs = require('dayjs')
const dotenv = require('dotenv')
dotenv.config();
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const oaklandHospitals = ['Highland and Fairmont Hospitals'];

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

    const hospitals = await page.$$eval('table#ucViewGrid_dgView>tbody>tr>td:nth-child(5)', tds => tds.map((td) => {
      return td.innerText.split('\n')[1];
    }));
    const infos = await page.$$eval('table#ucViewGrid_dgView>tbody>tr>td:nth-child(3)', tds => tds.map((td) => {
      const cell = td.innerText.split('\n');
      return {referralId: cell[0], dateTime: cell[2]}
    }));

    for (let i = 1; i < infos.length; i++) {
      const {referralId, dateTime} = infos[i];
      const hospital = hospitals[i];
      if (!data[referralId]) {
        data[referralId] = {
          referralId,
          dateTime,
          hospital,
        }
        if (oaklandHospitals.indexOf(hospital) !== -1 && !isInit) {
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
