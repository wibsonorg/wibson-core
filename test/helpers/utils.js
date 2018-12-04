const randomIds = (n, max) => {
  const res = [];
  const used = {};

  used[0] = true;

  for (let i = 0; i < n; i += 1) {
    let id = 0;
    while (id in used) {
      id = Math.trunc(Math.random() * max);
    }
    used[id] = true;
    res.push(id);
  }
  return res;
};

const hex = x => (`00${x.toString(16)}`).substr(-2);

const toHex = (x) => {
  let ret = '';

  for (let i = 0; i < x.length; i += 1) {
    ret += hex(x.charCodeAt(i));
  }

  return ret;
};

const getPayData = (list) => {
  const bytesPerId = 4;
  list.sort((a, b) => a - b);

  let last = 0;
  let data = '';

  for (let i = 0; i < list.length; i += 1) {
    let delta = list[i] - last;

    let number = '';
    for (let j = 0; j < bytesPerId; j += 1) {
      number = hex(delta % 256) + number;
      delta = Math.trunc(delta / 256);
    }

    data += number;

    last = list[i];
  }

  return new web3.BigNumber(`0xff${hex(bytesPerId)}${data}`);
};

export {
  randomIds,
  toHex,
  getPayData,
};
