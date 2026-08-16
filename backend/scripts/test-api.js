const axios = require('axios');
async function test() {
  try {
    const res = await axios.get("https://stayq-api-608570851336.asia-south1.run.app/api/v1/admin/moderation/test-host-applications");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log("Error:", e.response?.status, e.response?.data);
  }
}
test();
