import numpy as np

BASE = 10**10

def nthRoot(base, n):
    precision = .000000001
    x2 = 1
    delX = 1000

    while (delX > precision):
        x1 = x2
        num = (x1**n) - base
        denom = n*(x1**(n-1))
        x2 = x1 - (num/denom)
        
        if(x2 >  x1):
            delX = x2 - x1
        else:
            delX = x1 - x2

    return x2

def expApprox(base, n):
    precision = .00000001
    x2 = 1
    delX = 1000

    while (delX > precision):
        x1 = x2
        num = ((np.log(x1))/np.log(base)) - n
        denom = 1/(x1*np.log(base))
        x2 = x1 - (num/denom)
        
        if(x2 >  x1):
            delX = x2 - x1
        else:
            delX = x1 - x2

    return x2



test = expApprox(100,.5) 
print(test)