// const express = require('express');
const proj4 = require('proj4');
// const app = express();
// const port = 3000;

proj4.defs('WGS84', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');
proj4.defs('KATEC', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43' );

let  wgs84 = new proj4.Proj('WGS84');
let  katec = new proj4.Proj('KATEC');

let wgs84ToKatec = ( lat, lon ) =>{
  if(!lat) lat = 37.51667430329217;
  if(!lon) lon = 127.11382325859017;

	let {x, y, z} = proj4.transform( wgs84, katec, [lon,lat]);
	return { x, y, z }
}

let katecToWgs84 = ( x, y )=>{
  if(!x) x = 321857;
  if(!y) y = 546422;
  
	var {x:longitude, y: latitude} = proj4.transform( katec, wgs84, [x,y]);
	return {
		latitude,
		longitude
	};
}

// const args = process.argv.slice(2);
// const [currentType, value1, value2] = args;

// if (currentType === 'wgs') {
//     const result = wgs84ToKatec(parseFloat(value1), parseFloat(value2));
//     console.log(result);
// } else if (currentType === 'katec') {
//     const result = katecToWgs84(parseFloat(value1), parseFloat(value2));
//     console.log(result);
// } else {
//     console.log('Invalid conversion type. Use "wgs" or "katec".');
// }


/* 1. 해당 페이지에 express를 별도로 사용하여 구현하기
app.get('/convert', (req, res) => {
  const { currentType = 'katec', value1, value2 } = req.query;

  if (currentType === 'wgs') {
      const result = wgs84ToKatec(parseFloat(value1), parseFloat(value2));
      res.json(result);
  } else if (currentType === 'katec') {
      const result = katecToWgs84(parseFloat(value1), parseFloat(value2));
      res.json(result);
  } else {
      res.status(400).send('Invalid conversion type. Use "wgs" or "katec".');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 
*/


/* 2. express로 listen 하는 페이지에서 handleConversion 모듈 호출하여 사용하기
const handleConversion = (req, res) => {
  const { currentType = 'katec', value1, value2 } = req.query;
  
  if (isNaN(value1) || isNaN(value2)) {
    return res.status(400).send('value1 and value2 must be numbers.');
  }

  if (currentType === 'wgs') {
      const result = wgs84ToKatec(parseFloat(value1), parseFloat(value2));
      res.json(result);
  } else if (currentType === 'katec') {
      const result = katecToWgs84(parseFloat(value1), parseFloat(value2));
      res.json(result);
  } else {
      res.status(400).send('Invalid conversion type. Use "wgs" or "katec".');
  }
};
  
// app.get('/convert', handleConversion);

module.exports = handleConversion;
*/







const onConvert = (currentType = 'katec', value1, value2) => {
  value1 = parseFloat(value1);
  value2 = parseFloat(value2);

  if (isNaN(value1)) value1 = null;
  if (isNaN(value2)) value2 = null;
  // if (isNaN(value1) || isNaN(value2)) {
  //   return { error: 'value1 and value2 must be numbers.' };
  // }

  if (currentType === 'wgs') {
    return wgs84ToKatec(value1, value2);
  } else if (currentType === 'katec') {
    return katecToWgs84(value1, value2);
  } else {
    return { error: 'Invalid conversion type. Use "wgs" or "katec".' };
  }
};


// 3. express로 listen 하는 페이지에서 handleConversion 모듈을 호출하되 서버 요청을 해당 페이지에서 구현하기
//  Node.js 환경에서 실행되기 때문에 JSX를 직접 사용할 수 없으므로(JSX는 주로 React) Express의 라우트를 사용하여 HTML을 반환하는 방식으로 구현.
//  onConvert 함수는 서버 측에서 정의된 함수이므로, 클라이언트 측에서 호출할 수 없음(HTML 에서 직접 호출 불가). 대신, 클라이언트 측에서 서버로 요청을 보내고, 서버에서 onConvert 함수를 호출하여 결과를 반환하도록 구현.
module.exports = (expressApp) => {
  expressApp.get('/convertRun', (req, res) => {
    const { currentType, value1, value2 } = req.query;
    const result = onConvert(currentType, value1, value2);
    if (result.error) {
      res.status(400).send(result.error);
    } else {
      res.json(result);
    }
  });

  expressApp.get('/convert', (req, res) => {
    res.send(`
      <div>
        <h1>Coordinate Converter</h1>
        <p>This is a simple coordinate converter API.</p>
        <p>Use the following endpoints to convert between WGS84 and KATEC coordinates:</p>
        <ul>
          <li><code>/convert?currentType=wgs&value1=37.51667430329217&value2=127.11382325859017</code></li>
          <li><code>/convert?currentType=katec&value1=321857&value2=546422</code></li>
        </ul>

        <form id="converterForm">
          <div>
            <label>Current Type :
              <select name="currentType" onchange="currentTypeChanged()">
                <option value="wgs">WGS84 to KATEC</option>
                <option value="katec">KATEC to WGS84</option>
              </select>
            </label>
          </div>
          <br>
          
          <div>
            <table style="margin-top: 20px;">
              <thead>
                <tr>
                  <th id="key1">Latitude</th>
                  <th id="key2">Longitude</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" name="value1" oninput="onValueChange()" required></td>
                  <td><input type="text" name="value2" required></td>
                </tr>
              </tbody>
            </table>
          </div>
          <br>

          <button type="button" onclick="convert()">Convert</button>
        </form>

        <div id="result">
          <table style="margin-top: 20px;">
            <thead>
              <tr>
                <th id="resultKey1"></th>
                <th id="resultKey2"></th>
              </tr>
            </thead>
            <tbody id="resultBody">
              <tr>
                <td id="resultValue1" style="padding: 0 10px;"></td>
                <td id="resultValue2" style="padding: 0 10px;"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <script>
        function onValueChange() {
          const value1 = document.querySelector('input[name="value1"]').value;

          let divider;
          if(value1.indexOf('	') !== -1) {
            divider = '	';
          } else if(value1.indexOf(',') !== -1) {
            divider = ',';
          }
          if(!!divider) {
            document.querySelector('input[name="value1"]').value = value1.split(divider)[0].trim();
            document.querySelector('input[name="value2"]').value = value1.split(divider)[1].trim();
          }
        }

        function currentTypeChanged() {
          const currentType = document.getElementsByName('currentType')[0].value;

          const key1 = document.getElementById('key1').innerText = currentType === 'wgs' ? 'Latitude' : 'X';
          const key2 = document.getElementById('key2').innerText = currentType === 'wgs' ? 'Longitude' : 'Y';

          document.getElementById('result').hidden = true;
        }

        function convert() {
          const form = document.getElementById('converterForm');
          const currentType = form.currentType.value;
          const value1 = form.value1.value;
          const value2 = form.value2.value;

          fetch(\`/convertRun?currentType=\${currentType}&value1=\${value1}&value2=\${value2}\`)
          .then(response => response.json())
          .then(data => {
            document.getElementById('result').hidden = false;
            Object.keys(data).forEach((key, index) => {
              document.getElementById('resultKey' + (index + 1)).innerText = key;
              document.getElementById('resultValue' + (index + 1)).innerText = data[key] + (index == 0 ? ',' : '');
            });
            // document.getElementById('result').innerText = JSON.stringify(data, null, 2);
          })
          .catch(error => {
            document.getElementById('result').innerText = 'Error: ' + error;
          });
        }
      </script>
    `);
  });
}