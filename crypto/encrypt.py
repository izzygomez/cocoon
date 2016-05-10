#!/usr/bin/python

import argparse
import base64
import math
import json
from suffix_tree import SuffixTree
from Crypto.Cipher import AES
import hashlib
import random
import string

import prp

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
K_3 = 'This is a key987'
K_4 = 'This is a key191'
K_D = 'This is a key123'
K_C = 'This is a key234'
K_L = 'This is a key777'
IV_D = 'This is an IV456'
IV_C = 'This is an IV567'
IV_L = 'This is an IV777'

K_1 += K_1
K_3 += K_3
K_4 += K_4
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
print '\tdone'

print 'constructing L...'
L = [None] * len(st.string)
for leaf in st.leaves:
  index = str(length - len(leaf.pathLabel) + 1)
  aes_L = AES.new(K_L, AES.MODE_CBC, IV_L)
  raw = aes_L.encrypt(pad(index))
  value = base64.b64encode(raw)
  L[leaf.erdex] = value
print '\tdone'

print 'permuting C...'
C_p = [None] * (2 ** int(math.ceil(math.log(len(C), 2))))
for i in xrange(len(C)):
  p_i = prp.permuteSecure(i, len(C_p), K_3)
  C_p[p_i] = C[i]
for i in xrange(len(C), len(C_p)):
  p_i = prp.permuteSecure(i, len(C_p), K_3)
  c = random.choice(string.ascii_letters)
  aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
  raw = aes_C.encrypt(pad(c))
  C_p[p_i] = base64.b64encode(raw)
print '\tdone'

print 'permuting L...'
L_p = [None] * (2 ** int(math.ceil(math.log(len(L), 2))))
for i in xrange(len(L)):
  p_i = prp.permuteSecure(i, len(L_p), K_4)
  L_p[p_i] = L[i]
for i in xrange(len(L), len(L_p)):
  p_i = prp.permuteSecure(i, len(L_p), K_4)
  aes_L = AES.new(K_L, AES.MODE_CBC, IV_L)
  raw = aes_L.encrypt(pad(str(i)))
  L_p[p_i] = base64.b64encode(raw)
print '\tdone'

print 'saving to file...'
with open('ciphertext.txt', 'w') as fout:
  fout.write(str(len(D)) + '\n')
  for key in D:
    fout.write(json.dumps({key: D[key]}) + '\n')
  fout.write(str(len(C_p)) + '\n')
  for c in C_p:
    fout.write(c + '\n')
  fout.write(str(len(L_p)) + '\n')
  for l in L_p:
    fout.write(l + '\n')
print 'DONE'

# # to parse ciphertext
# D2 = {}
# C2 = []
# L2 = []
# with open('ciphertext.txt') as f:
#   # read D
#   sizeD = int(f.readline())
#   for i in xrange(sizeD):
#     data = json.loads(f.readline())
#     key = data.keys()[0]
#     D2[key] = data[key]
#   # # check dictionary D
#   # for key in D2:
#   #   aes_D = AES.new(K_D, AES.MODE_CBC, IV_D)
#   #   raw = base64.b64decode(D2[key])
#   #   print key, unpad(aes_D.decrypt(raw))
# 
#   # read array C
#   sizeC = int(f.readline())
#   for i in xrange(sizeC):
#     C2.append(f.readline()[:-1])
#     C2[i] = base64.b64decode(C2[i])
#   # # check array C
#   # C3 = [None] * len(C2)
#   # for i, c in enumerate(C2):
#   #   i_unperm = prp.unpermuteSecure(i, len(C2), K_3)
#   #   aes_C = AES.new(K_C, AES.MODE_CBC, IV_C)
#   #   decrypted = unpad(aes_C.decrypt(c))[-1:]
#   #   C3[i_unperm] = decrypted
#   # C4 = ''.join(C3)
#   # print C4
# 
#   # read array L
#   sizeL = int(f.readline())
#   for i in xrange(sizeL):
#     L2.append(f.readline()[:-1])
#     L2[i] = base64.b64decode(L2[i])
#   # check array L
#   L3 = [None] * len(L2)
#   for i, c in enumerate(L2):
#     i_unperm = prp.unpermuteSecure(i, len(L2), K_4)
#     aes_L = AES.new(K_L, AES.MODE_CBC, IV_L)
#     decrypted = unpad(aes_L.decrypt(c))
#     L3[i_unperm] = decrypted
#     L3[i] = decrypted
#   print L3
