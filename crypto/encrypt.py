#!/usr/bin/python
import base64

import time
import csv
import json
from suffix_tree import SuffixTree
from Crypto.Cipher import AES
import hashlib

K_1 = 'This is a key789'
K_D = 'This is a key123'
IV = 'This is an IV456'

f = open('../files/small_shakespeare.txt')
st = SuffixTree(f.read())
length = len(st.string) - 1

D = {}
for leaf in st.leaves:
  initPath = leaf.pathLabel[:len(leaf.parent.pathLabel)+1]
  key = hashlib.sha256(initPath.encode()).hexdigest()

  index = '{:>16}'.format(str(length - len(leaf.pathLabel)))
  aes_D = AES.new(K_D, AES.MODE_CBC, IV)
  raw = aes_D.encrypt(index)
  value = base64.b64encode(raw)

  D[key] = value


with open('ciphertext.json', 'w') as fout:
  for key in D:
    fout.write(json.dumps({key: D[key]}) + '\n')

data = []
D2 = {}
with open('ciphertext.json') as f:
  for line in f:
    data = json.loads(line)
    key = data.keys()[0]
    D2[key] = data[key]

  for key in D2:
    aes_D2 = AES.new(K_D, AES.MODE_CBC, IV)
    raw = base64.b64decode(D2[key])
    print key, aes_D2.decrypt(raw)
