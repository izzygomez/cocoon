from Crypto.Cipher import AES
import base64
import hashlib
import math
 
BS = 16
pad = lambda s: s + (BS - len(s) % BS) * chr(BS - len(s) % BS) 
unpad = lambda s : s[0:-ord(s[-1])]

# pseudo-random function
def PRF(key, plaintext):
  keyHash = hashlib.sha256(key).hexdigest()
  ptxtHash = hashlib.sha256(plaintext).hexdigest()
  return hashlib.sha256((ptxtHash + keyHash)).hexdigest()

def CBC_MAC(key, iv, text):
  aes = AES.new(key, AES.MODE_CBC, iv)
  raw = aes.encrypt(pad(text))
  hex_string = raw.encode('hex')
  hex_MAC = hex_string[-32:]
  raw_MAC = hex_MAC.decode('hex')
  return base64.b64encode(raw_MAC)

def AES_Enc(key, iv, text):
  aes = AES.new(key, AES.MODE_CBC, iv)
  raw = aes.encrypt(pad(text))
  return base64.b64encode(raw)

def AES_Dec(key, iv, ctxt):
  aes = AES.new(key, AES.MODE_CBC, iv)
  raw = base64.b64decode(ctxt)
  return unpad(aes.decrypt(raw))

# index, inputSize are integers
# key is a string
# Return the permuted index
def permute(index, inputSize, key):
  # Pad the index and inputSize to make sure they are a power of 2
  bitLength = int(math.ceil(math.log(inputSize, 2)))
  paddedIndex = bin(index)[2:].zfill(bitLength)
  # Next, split into left and right
  # If there are an even amount of bits
  if bitLength % 2 == 0:
    leftHalf = paddedIndex[:bitLength/2]
    rightHalf = paddedIndex[bitLength/2:]
    rightRandom = hashBinary(rightHalf, key, bitLength/2)
    leftHalf = int(leftHalf, 2)
    rightRandom = int(rightRandom, 2)
    rightXor = leftHalf ^ rightRandom
    rightXor = bin(rightXor)[2:].zfill(bitLength/2)
    concatenation = rightHalf + rightXor
    return int(concatenation, 2)
  # In case there are an odd number of bits
  else:
    leftHalf = paddedIndex[:bitLength/2]
    rightHalf = paddedIndex[bitLength/2:]
    rightRandom = hashBinary(rightHalf[:bitLength/2+1], key, bitLength/2)
    leftHalf = int(leftHalf, 2)
    rightRandom = int(rightRandom, 2)
    rightXor = leftHalf ^ rightRandom
    rightXor = bin(rightXor)[2:].zfill(bitLength/2)
    concatenation = rightHalf + rightXor
    return int(concatenation, 2)

# Takes in a value (binary), key (string), and length, and returns a hash 
# of the value of length length.
def hashBinary(value, key, length):
  keyHash = hashlib.sha256(key.encode()).hexdigest()
  valueHash = hashlib.sha256(value.encode()).hexdigest()
  hashValue = hashlib.sha256((valueHash + keyHash).encode()).hexdigest()
  return bin(int(hashValue, 16))[2:length+2]

# Similar to the above function
def unpermute(permutedIndex, inputSize, key):
  # Pad the index and inputSize to make sure they are a power of 2
  bitLength = int(math.ceil(math.log(inputSize, 2)))
  paddedPermutedIndex = bin(permutedIndex)[2:].zfill(bitLength)
  # Next, split into left and right
  # If there are an even amount of bits
  if bitLength % 2 == 0:
    leftHalf = paddedPermutedIndex[:bitLength/2]
    rightHalf = paddedPermutedIndex[bitLength/2:]
    leftRandom = hashBinary(leftHalf, key, bitLength/2)
    rightHalf = int(rightHalf, 2)
    leftRandom = int(leftRandom, 2)
    leftXor = leftRandom ^ rightHalf
    leftXor = bin(leftXor)[2:].zfill(bitLength/2)
    concatenation = leftXor + leftHalf
    return int(concatenation, 2)
  else:
    leftHalf = paddedPermutedIndex[:bitLength/2 + 1]
    rightHalf = paddedPermutedIndex[bitLength/2 + 1:]
    leftRandom = hashBinary(leftHalf[:bitLength/2], key, bitLength/2)
    rightHalf = int(rightHalf, 2)
    leftRandom = int(leftRandom, 2)
    leftXor = leftRandom ^ rightHalf
    leftXor = bin(leftXor)[2:].zfill(bitLength/2)
    concatenation = leftXor + leftHalf
    return int(concatenation, 2)

def permuteSecure(index, inputSize, key):
  firstRound = permute(index, inputSize, key)
  secondRound = permute(firstRound, inputSize, key)
  thirdRound = permute(secondRound, inputSize, key)
  return thirdRound

def unpermuteSecure(permutedIndex, inputSize, key):
  firstRound = unpermute(permutedIndex, inputSize, key)
  secondRound = unpermute(firstRound, inputSize, key)
  thirdRound = unpermute(secondRound, inputSize, key)
  return thirdRound
