from fastapi import FastAPI
# from fastapi_socketio import SocketManager

socket_manager = None

def init_socket(app: FastAPI):
    global socket_manager
    # socket_manager = SocketManager(app)
    print("SocketIO disabled for now")