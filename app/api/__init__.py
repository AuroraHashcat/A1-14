"""
API蓝图
"""

from flask import Blueprint

bp = Blueprint('api', __name__)

from app.api import auth, evaluation, evidence, report, knowledge, query, system, preparation
