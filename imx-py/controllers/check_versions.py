"""
py -3 check_versions.py
"""

import sys
import stix
import cybox
import maec
import mixbox
import stixmarx
import pycountry
import stix2validator
import stix2elevator
import lxml

print("\n")
print("python version         " + str(sys.version))
print("stix version           " + str(stix.__version__))
print("cybox version          " + str(cybox.__version__))
print("mixbox version         " + str(mixbox.__version__))
print("stixmarx version       " + str(stixmarx.__version__))
print("pycountry version      " + str(pycountry.__version__))
print("maec version           " + str(maec.__version__))
print("lxml version           " + str(lxml.__version__))
print("stix2validator version " + str(stix2validator.__version__))
print("stix2elevator version  " + str(stix2elevator.__version__))
try:
    import STIXHelper
    import STIXLinks

    print("stixhelper version     " + str(STIXHelper.__version__))
    print("stixlinks version      " + str(STIXLinks.__version__))
except ImportError:
    print("STIXHelper/STIXLinks not found")
