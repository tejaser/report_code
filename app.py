from flask import Flask, render_template, request, redirect, url_for
from flask_bootstrap import Bootstrap
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField
from wtforms.validators import InputRequired, Email, Length
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import sys
import json
import pymongo
from bson import json_util
from bson.json_util import dumps
from flask_login import LoginManager, UserMixin, login_required, logout_user, current_user, login_user
# from credens import *

# print a nice greeting.

FIELDS = {}
SQL_URI = ""
MONGO_URI = ""
SECRET = ''

# EB looks for an 'application' callable by default.
application = Flask(__name__)
application.config['SECRET_KEY'] = SECRET
application.config['SQLALCHEMY_DATABASE_URI'] = SQL_URI
Bootstrap(application)
db = SQLAlchemy(application)
login_manager = LoginManager()
login_manager.init_app(application)
login_manager.login_view = 'login'


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True)
    email = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(80))


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class loginForm(FlaskForm):
    username = StringField('username', validators=[
                           InputRequired(), Length(min=4, max=15)])
    password = PasswordField('password', validators=[
                             InputRequired(), Length(min=8, max=80)])
    remember = BooleanField('remember me')


class RegistrationForm(FlaskForm):
    email = StringField('email', validators=[InputRequired(), Email(
        message='Invalid email'), Length(max=50)])
    username = StringField('username', validators=[
                           InputRequired(), Length(min=4, max=15)])
    password = PasswordField('password', validators=[
                             InputRequired(), Length(min=8, max=80)])

# connect to mongolab -- all database credentials in a 'credens' file


@application.route('/')
def index():
    return render_template('index.html')


@application.route('/login', methods=['GET', 'POST'])
def login():
    form = loginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            if check_password_hash(user.password, form.password.data):
                login_user(user, remember=form.remember.data)
                return redirect(url_for('home'))
        return '<h1>Invalid username or password </h1>'
        # return '<h1>' + form.username.data + ' ' + form.password.data + '</h1>'

    return render_template('login.html', form=form)


@application.route('/signup', methods=['GET', 'POST'])
@login_required
def signup():
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(
            form.password.data, method='sha256')
        new_user = User(username=form.username.data,
                        email=form.email.data, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return '<h1>New user has been created</h1>'
        # return '<h1>' + form.username.data + ' ' + form.email.data + ' ' + form.password.data + '</h1>'

    return render_template('signup.html', form=form)


@application.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


@application.route('/home')
@login_required
def home():
    companies = []
    connection = pymongo.MongoClient(MONGO_URI)
    # which database and which collection to use goes here
    db = connection['tejas-social']['fb_data']
    results = db.find().distinct('Account')
    if results:
        for result in results:
            companies.append(result)
        # companies = json.dumps(companies, default=json_util.default)
        connection.close()
    return render_template("home.html", companies=companies, name=current_user.username)


@application.route('/summary', methods=['GET', 'POST'])
@login_required
def summary(account=None):
    account = request.args.get('account')
    account = account.replace('_', ' ')
    connection = pymongo.MongoClient(MONGO_URI)
    # which database and which collection to use goes here
    db = connection['tejas-social']['ga_data']
    results = db.find(
        {'Account': account})
    json_projects = []
    if results:
        for result in results:
            json_projects.append(result)
        # json_projects = json.dumps(json_projects, default=json_util.default)
        connection.close()
    cm_ga_rev,  cm_fb_rev, lm_ga_rev, lm_fb_rev = [0.0 for _ in range(4)]
    lm_fb_reach, lm_fb_clicks, lm_fb_impression, cm_fb_reach, cm_fb_clicks, cm_fb_impression = [
        0 for _ in range(6)]
    lm_ga_orders, cm_ga_orders = [0 for _ in range(2)]
    for item in json_projects:
        if item['Comparision'] == 'CM':
            cm_ga_rev = item['GA_Revenue']
            cm_ga_orders = item['GA_orders']
            cm_fb_rev = item['FB_Revenue']
            cm_fb_reach = item['Reach']
            cm_fb_clicks = item['Link_clicks']
            cm_fb_impression = item['Impressions']
        elif item['Comparision'] == 'LM':
            lm_ga_rev = item['GA_Revenue']
            lm_ga_orders = item['GA_orders']
            lm_fb_rev = item['FB_Revenue']
            lm_fb_reach = item['Reach']
            lm_fb_clicks = item['Link_clicks']
            lm_fb_impression = item['Impressions']
    if((lm_ga_rev == 0.0) or (lm_fb_rev == 0.0) or (lm_fb_reach == 0) or (lm_fb_clicks == 0) or (lm_fb_impression == 0) or (lm_ga_orders == 0)):
        ga_rev_change, ga_orders_change, fb_rev_change, fb_reach_change, fb_clicks_change, fb_impression_change = [
            'NA' for _ in range(6)]
    else:
        ga_rev_change = ((cm_ga_rev - lm_ga_rev)/lm_ga_rev) * 100
        ga_orders_change = ((cm_ga_orders - lm_ga_orders)/lm_ga_orders) * 100
        fb_rev_change = ((cm_fb_rev - lm_fb_rev)/lm_fb_rev) * 100
        fb_reach_change = ((cm_fb_reach - lm_fb_reach)/lm_fb_reach) * 100
        fb_clicks_change = ((cm_fb_clicks - lm_fb_clicks)/lm_fb_clicks) * 100
        fb_impression_change = (
            (cm_fb_impression - lm_fb_impression)/lm_fb_impression) * 100
    return render_template("summary.html", account=account, name=current_user.username, lm_fb_impression=lm_fb_impression, cm_fb_impression=cm_fb_impression, lm_fb_clicks=lm_fb_clicks, cm_fb_clicks=cm_fb_clicks, lm_fb_reach=lm_fb_reach, cm_fb_reach=cm_fb_reach, fb_impression_change=fb_impression_change, fb_clicks_change=fb_clicks_change, fb_reach_change=fb_reach_change, ga_orders_change=ga_orders_change, ga_rev_change=ga_rev_change, fb_rev_change=fb_rev_change, cm_ga_rev=cm_ga_rev, lm_ga_rev=lm_ga_rev, cm_ga_orders=cm_ga_orders, lm_ga_orders=lm_ga_orders, lm_fb_rev=lm_fb_rev, cm_fb_rev=cm_fb_rev)


@application.route('/fbdata', methods=['GET'])
@login_required
def viewdbfile(account=None):
    connection = pymongo.MongoClient(MONGO_URI)
    # which database and which collection to use goes here
    db = connection['tejas-social']['fb_data']
    account = request.args.get('account')
    account = account.replace('_', ' ')
    results = db.find(
        {'Account': account, 'Comparision': 'CM'})
    json_projects = []
    if results:
        for result in results:
            json_projects.append(result)
        json_projects = json.dumps(json_projects, default=json_util.default)
        connection.close()

        return json_projects
    else:
        return 'error reading file..'


@application.route('/detail',  methods=['GET'])
@login_required
def getDetailPage(account=None):
    account = request.args.get('account')
    account = account.replace('_', ' ')
    return render_template("detail.html", account=account, name=current_user.username)


if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    #app.debug = True
    application.run(debug=True)
