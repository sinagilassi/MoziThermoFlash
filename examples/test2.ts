# import libs
import pyThermoFlash as ptf
from rich import print
import os
import pyThermoDB as ptdb
import pyThermoLinkDB as ptdblink

# version
print(ptf.__version__)
# check version
print(ptdb.__version__)
# check version
print(ptdblink.__version__)

# SECTION: examples
#!Example 10 - 4, Page 452, Fundamental of Chemical Engineering Thermodynamics, Kevin D.Dahm



# =======================================
#!THERMOFLASH CALCULATION
# =======================================
# SECTION: vle model
# components
components = ['water', 'ethanol']

# model source
model_source = {
    'datasource': datasource,
    'equationsource': equationsource
}

# init vle
vle = ptf.vle(components, model_source = model_source)
print(type(vle))

# NOTE: check sources
print(vle.datasource)
print(vle.equationsource)

# alpha(Binary Interaction Parameter)
alpha = [
    [0, 0.3],
    [0.3, 0]
]
# a_ij
a_ij = [
    [0.0, 3.458],
    [-0.801, 0.0]
]
# b_ij
b_ij = [
    [0.0, -586.1],
    [246.2, 0.0]
]
# c_ij
c_ij = [
    [0.0, 0.0],
    [0.0, 0.0]
]
# d_ij
d_ij = [
    [0.0, 0.0],
    [0.0, 0.0]
]
# activity model
activity_inputs = {
    'alpha': alpha,
    'a_ij': a_ij,
    'b_ij': b_ij,
    'c_ij': c_ij,
    'd_ij': d_ij
}

# inputs
inputs = {
    'mole_fraction': { 'water': 0.50, 'ethanol': 0.50 },
    'temperature': [30.0, 'C'],
    'pressure': [7.0, 'kPa']
}

# SECTION: flash calculation
# NOTE: flash calculation(least_squares)
# res_bp = vle.flash_isothermal(inputs = inputs)
# print(res_bp)

# NOTE: flash calculation(minimize): not recommended
# res_bp = vle.flash_isothermal(inputs = inputs, solver_method = 'minimize')
# print(res_bp)

# REVIEW: modified raoult's law (soon)
res_bp = vle.flash_isothermal(
    inputs = inputs,
    equilibrium_model = 'modified-raoult',
    activity_model = 'NRTL',
    solver_method = 'least_squares',
    activity_inputs = activity_inputs)
print(res_bp)
