#!/usr/bin/python

import argparse
import base64
import json
from suffix_tree import SuffixTree
from Crypto.Cipher import AES
import hashlib

parser = argparse.ArgumentParser()
parser.add_argument('--filename', '-f', default='../files/small_shakespeare.txt',
                    help='Path of file to encrypt')
args = parser.parse_args()

K_1 = 'This is a key789'
K_D = 'This is a key123'
K_C = 'This is a key234'
IV_D = 'This is an IV456'
IV_C = 'This is an IV567'

filename = args.filename

st = None
length = None
with open(filename) as f:
  st = SuffixTree(f.read())
  length = len(st.string) - 1

D = {}
for leaf in st.leaves:
  initPath = leaf.pathLabel[:leaf.parent.stringDepth+1]
  key = hashlib.sha256(initPath.encode()).hexdigest()
  index = '{:>16}'.format(str(length - len(leaf.pathLabel)))
  aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
  raw = aes_D.encrypt(index)
  value = base64.b64encode(raw)
  D[key] = value

C = [None] * (len(st.string) - 1)
for i, c in enumerate(st.string[:-1]):
  aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
  raw = aes_C.encrypt('{:>16}'.format(c))
  value = base64.b64encode(raw)
  C[i] = value

with open('ciphertext.txt', 'w') as fout:
  fout.write(str(len(D)) + '\n')
  for key in D:
    fout.write(json.dumps({key: D[key]}) + '\n')
  fout.write(str(len(C)) + '\n')
  for c in C:
    fout.write(c + '\n')

# to parse ciphertext
D2 = {}
C2 = []
with open('ciphertext.txt') as f:
  sizeD = int(f.readline())
  for i in xrange(sizeD):
    data = json.loads(f.readline())
    key = data.keys()[0]
    D2[key] = data[key]

  sizeC = int(f.readline())
  for i in xrange(sizeC):
    C2.append(f.readline()[:-1])
    C2[i] = base64.b64decode(C2[i])

  # # check dictionary D
  # for key in D2:
  #   aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
  #   raw = base64.b64decode(D2[key])
  #   print key, aes_D.decrypt(raw)

  # # check array C
  # C3 = []
  # for c in C2:
  #   aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
  #   decrypted = aes_C.decrypt(c)[-1:]
  #   C3.append(decrypted)
  # C4 = ''.join(C3)
  # print C4
