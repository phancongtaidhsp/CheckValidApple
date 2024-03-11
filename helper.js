function randomBirthdate() {
  let day = Math.floor(Math.random() * 12) + 1;
  if(day<10) {
    day = `0${day}`
  }
  let month = Math.floor(Math.random() * 12) + 1;
  if(month<10) {
    month = `0${month}`
  }
  var year = Math.floor(Math.random() * 30) + 1980;
  return `${year}-${month}-${day}`;
}
function randomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

module.exports = {
  randomBirthdate,
  randomString
}