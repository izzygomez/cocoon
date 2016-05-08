#!/usr/bin/python

import argparse
import base64
import json
from suffix_tree import SuffixTree
from Crypto.Cipher import AES
import hashlib

parser = argparse.ArgumentParser()
parser.add_argument('--filename', '-f', default='../files/shakespeare_poem.txt',
                    help='Path of file to encrypt')
args = parser.parse_args()

def getIndexOfInnerNode(node, length):
  while node.firstChild is not None:
    node = node.firstChild
  return length - len(node.pathLabel) + 1

def F(key, plaintext):
  keyHash = hashlib.sha256(key.encode()).hexdigest()
  ptxtHash = hashlib.sha256(plaintext.encode()).hexdigest()
  return hashlib.sha256((ptxtHash + keyHash).encode()).hexdigest()

BS = 16
pad = lambda s: s + (BS - len(s) % BS) * chr(BS - len(s) % BS) 
unpad = lambda s : s[0:-ord(s[-1])]

K_1 = 'This is a key789'
K_D = 'This is a key123'
K_C = 'This is a key234'
K_L = 'This is a key345'
IV_D = 'This is an IV456'
IV_C = 'This is an IV567'

K_1 += K_1
K_D += K_D
K_C += K_C
K_L += K_L

filename = args.filename

# key = 'This is a key12 This is a key12 '
# text = 'string of size16'
# iv = 'This is an IV456'
# aes = AES.new(key, AES.MODE_CBC, iv)
# ciphertext = aes.encrypt(pad(text))
# ciphertext = base64.b64encode(ciphertext)
#
# aes = AES.new(key, AES.MODE_CBC, iv)
# plaintext = aes.decrypt(base64.b64decode(ciphertext))
# print unpad(plaintext)

st = None
length = None
with open(filename) as f:
  print 'Constructing suffix tree...'
  st = SuffixTree(f.read())
  print 'done'
  length = len(st.string) - 1

print 'Encrypting suffix tree...'
D = {}
print '\tProcessing leaves...'
for leaf in st.leaves:
  leafPL = leaf.pathLabel[:len(leaf.pathLabel)-1] + '$'
  parentPL = leaf.parent.pathLabel
  initPath = leafPL[:len(parentPL)+1]
  key = F(K_1, initPath)

  index = str(length - len(leaf.pathLabel) + 1)
  leafpos = str(leaf.erdex)
  num_leaves = str(leaf.numLeaves)
  together = index + "---" + leafpos + "---" + num_leaves

  aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
  raw = aes_D.encrypt(pad(together))
  value = base64.b64encode(raw)

  D[key] = value

print '\tProcessing inner nodes...'
for innerNode in st.innerNodes:
  if innerNode.stringDepth == 0:
    continue
  nodePL = innerNode.pathLabel
  parentPL = innerNode.parent.pathLabel
  initPath = nodePL[:len(parentPL)+1]
  key = F(K_1, initPath)

  index = str(getIndexOfInnerNode(innerNode, length))
  leafpos = str(innerNode.erdex)
  num_leaves = str(innerNode.numLeaves)
  together = index + "---" + leafpos + "---" + num_leaves

  aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
  raw = aes_D.encrypt(pad(together))
  value = base64.b64encode(raw)

  D[key] = value

print 'done'

print 'constructing C...'
C = [None] * (len(st.string) - 1)
for i, c in enumerate(st.string[:-1]):
  aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
  raw = aes_C.encrypt(pad(c))
  value = base64.b64encode(raw)
  C[i] = value
print 'done'

print 'saving to file...'
with open('ciphertext.txt', 'w') as fout:
  fout.write(str(len(D)) + '\n')
  for key in D:
    fout.write(json.dumps({key: D[key]}) + '\n')
  fout.write(str(len(C)) + '\n')
  for c in C:
    fout.write(c + '\n')
print 'DONE'

# # to parse ciphertext
# D2 = {}
# C2 = []
# with open('ciphertext.txt') as f:
#   sizeD = int(f.readline())
#   for i in xrange(sizeD):
#     data = json.loads(f.readline())
#     key = data.keys()[0]
#     D2[key] = data[key]
# 
#   sizeC = int(f.readline())
#   for i in xrange(sizeC):
#     C2.append(f.readline()[:-1])
#     C2[i] = base64.b64decode(C2[i])
# 
#   # check dictionary D
#   for key in D2:
#     aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
#     raw = base64.b64decode(D2[key])
#     print key, unpad(aes_D.decrypt(raw))
# 
#   # # check array C
#   # C3 = []
#   # for c in C2:
#   #   aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
#   #   decrypted = unpad(aes_C.decrypt(c))[-1:]
#   #   C3.append(decrypted)
#   # C4 = ''.join(C3)
#   # print C4
