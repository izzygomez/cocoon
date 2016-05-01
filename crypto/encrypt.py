import time
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
  value = aes_D.encrypt(index)

  D[key] = value

for key in D:
  aes_D2 = AES.new(K_D, AES.MODE_CBC, IV)
  print key, aes_D2.decrypt(D[key])
