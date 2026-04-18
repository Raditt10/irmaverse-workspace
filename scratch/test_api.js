async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/dashboard');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
