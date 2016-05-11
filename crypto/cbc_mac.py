from Crypto.Cipher import AES
import base64
 
BS = 16
pad = lambda s: s + (BS - len(s) % BS) * chr(BS - len(s) % BS) 
unpad = lambda s : s[0:-ord(s[-1])]

def CBC_MAC(key, iv, text):
  aes_D = AES.new(key, AES.MODE_CBC, iv)
  raw = aes_D.encrypt(pad(text))
  hex_string = raw.encode('hex')
  hex_MAC = hex_string[-32:]
  raw_MAC = hex_MAC.decode('hex')
  return base64.b64encode(raw_MAC)
