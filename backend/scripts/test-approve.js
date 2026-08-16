const axios = require('axios');
async function test() {
  try {
    const res = await axios.post("https://stayq-api-608570851336.asia-south1.run.app/api/v1/admin/moderation/test-host-applications/b3305101-bc03-4a2d-ba8d-243e2d59180f/approve");
    console.log(res.data);
  } catch (e) {
    console.log("Error:", e.response?.status, e.response?.data);
  }
}
test();
