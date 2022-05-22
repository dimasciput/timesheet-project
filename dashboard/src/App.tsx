import React, {useEffect, useState} from 'react';
import './styles/App.scss';
import {
    Container,
    Autocomplete,
    TextField, CircularProgress, Button, Grid, CardContent, CardActions, Box
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TimeLogTable from "./components/TimeLogTable";
import { theme } from "./utils/Theme";
import {ThemeProvider} from "@mui/material/styles";
import {useAddTimesheetMutation} from "./services/api";

function addHours(numOfHours: any, date = new Date()) {
    let numOfSeconds = numOfHours / 3600
    date.setTime(date.getTime() + numOfSeconds * 60 * 60 * 60 * 60 * 1000);
    return date;
}

function formatTime(date = new Date()) {
    return (
        `${date.getFullYear()}-${("0" + date.getMonth()).slice(-2)}-${("0" + date.getDate()).slice(-2)} ` +
        `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    )
}

interface TimeCardProps {
    task?: any | null,
    activity?: any | null,
    description?: String | '',
    clearAllFields?: any
}

function TimeCard({ task, activity, description, clearAllFields } : TimeCardProps) {
    const [startTime, setStartTime] = React.useState<Date | null>(new Date());
    const [hours, setHours] = React.useState<Number | null>(null);
    const [buttonDisabled, setButtonDisabled] = React.useState(true);

    const [addTimesheet, { isLoading: isUpdating, isSuccess, isError }] = useAddTimesheetMutation();

    useEffect(() => {
        setButtonDisabled(startTime == null || hours == null || !task || !activity)
    }, [startTime, hours, task])

    useEffect(() => {
        if (isSuccess) {
            setHours(null)
            clearAllFields()
        }
    }, [isSuccess])

    const addButtonClicked = async () => {
        // Calculate start-time and end-time
        let endTime = null
        if (hours && startTime) {
            let startTimeCopy = new Date(startTime.toISOString())
            endTime = addHours(hours, startTimeCopy)
        }
        if (!endTime || !startTime || !task || !activity) {
            return
        }
        let startTimeStr = formatTime(startTime)
        let endTimeStr = formatTime(endTime)
        addTimesheet({
            start_time: startTimeStr,
            end_time: endTimeStr,
            task: {
                'id': task.id
            },
            activity: {
                'id': activity.id
            },
            description: description
        })
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
                <CardContent sx={{ paddingLeft: 0, paddingRight: 0 }}>
                    <DateTimePicker
                        value={startTime}
                        onChange={(newValue) => setStartTime(newValue)}
                        renderInput={(params) => <TextField {...params} variant="standard" sx={{ width: 200 }} />}
                    />
                    <TextField
                        value={hours !== null ? hours : ''}
                        onChange={(event) => (
                            setHours(event.target.value !== '' ? parseFloat(event.target.value) : null)
                        )}
                        id="hour"
                        type="number"
                        InputProps={{
                            inputProps: { min: 0 }
                        }}
                        label="Hours" variant="standard" sx={{ width: 200 }} />
                </CardContent>
                <CardActions sx={{ justifyContent: "center" }}>
                    <ThemeProvider theme={theme}>
                        <Button color="main" variant="contained" size="small" sx={{ width: 200, marginTop: -1 }}
                                onClick={addButtonClicked}
                                disabled={buttonDisabled || isUpdating}
                                disableElevation>{isUpdating ? <CircularProgress color="inherit" size={20} /> : "Add" }</Button>
                    </ThemeProvider>
                </CardActions>
            </div>
        </LocalizationProvider>
    )
}


function App() {
    const [activities, setActivities] = useState([])
    const [selectedActivity, setSelectedActivity] = useState<String | null>(null)
    const [projectInput, setProjectInput] = useState('')
    const [projects, setProjects] = useState([])
    const [projectLoading, setProjectLoading] = useState(false)
    const [selectedProject, setSelectedProject] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [tasks, setTasks] = useState([])
    const [description, setDescription] = useState('')

    useEffect(() => {
        fetch('/activity-list/').then(
            response => response.json()
        ).then(
            json => {
                setActivities(json)
            }
        )
    }, [])

    useEffect(() => {
        setProjectLoading(true)
        if (projectInput.length > 2) {
            fetch('/project-list/?q=' + projectInput).then(
                response => response.json()
            ).then(
                json => {
                    setProjects(json)
                    setProjectLoading(false)
                }
            )
        } else {
            setProjects([])
            setProjectLoading(false)
        }
    }, [projectInput])


    useEffect(() => {
        if (selectedProject) {
            fetch('/task-list/' + selectedProject['id'] + '/').then(
                response => response.json()
            ).then(
                json => {
                    setTasks(json)
                }
            )
        } else {
            setTasks([])
        }
    }, [selectedProject])

    // Clear activity, task, project, and description
    const clearAllFields = () => {
        setSelectedProject(null)
        setSelectedActivity(null)
        setSelectedTask(null)
        setDescription('')
    }

    return (
        <div className="App">
            <Container maxWidth="lg">
                <div className="App-header">
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Autocomplete
                                disablePortal
                                id="combo-box-demo"
                                options={activities}
                                loading={activities.length > 0}
                                onChange={(event: any, value: any) => {
                                    if (value) {
                                        setSelectedActivity(value)
                                    }
                                }}
                                value={selectedActivity}
                                renderInput={(params) => (
                                    <TextField {...params}
                                       label="Activity"
                                       InputProps={{
                                           ...params.InputProps,
                                           endAdornment: (
                                               <React.Fragment>
                                                   { setActivities.length == 0 ?
                                                       <CircularProgress color="inherit" size={20} /> : null }
                                                   { params.InputProps.endAdornment }
                                               </React.Fragment>
                                           )
                                       }}
                                    />
                                )
                                }
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Autocomplete
                                disablePortal
                                id="combo-box-demo"
                                options={projects}
                                getOptionLabel={ options => (options['label'])}
                                isOptionEqualToValue={(option, value) => option['id'] == value['id']}
                                onChange={(event: any, value: any) => {
                                    if (value) {
                                        setSelectedProject(value)
                                    } else {
                                        setSelectedProject(null)
                                        setSelectedTask(null)
                                    }
                                }}
                                value={selectedProject}
                                onInputChange={(event, newInputValue) => {
                                    setProjectInput(newInputValue)
                                }}
                                loading={projectLoading}
                                renderInput={(params) => (
                                    <TextField {...params}
                                               label="Project"
                                               InputProps={{
                                                   ...params.InputProps,
                                                   endAdornment: (
                                                       <React.Fragment>
                                                           { projectLoading ?
                                                               <CircularProgress color="inherit" size={20} /> : null }
                                                           { params.InputProps.endAdornment }
                                                       </React.Fragment>
                                                   )
                                               }}
                                    />
                                )
                                }
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Autocomplete
                                disablePortal
                                id="combo-box-demo"
                                options={tasks}
                                getOptionLabel={ options => (options['label'])}
                                isOptionEqualToValue={(option, value) => option['id'] == value['id']}
                                onChange={(event: any, value: any) => {
                                    if (value) {
                                        setSelectedTask(value)
                                    } else {
                                        setSelectedTask(null)
                                    }
                                }}
                                value={selectedTask}
                                renderInput={(params) => <TextField {...params} label="Task"/>}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField style={{ width: "100%" }} label="Description" variant="outlined" value={description} onChange={e => setDescription(e.target.value)} />
                        </Grid>
                    </Grid>
                    <Box className="time-box">
                        <TimeCard task={selectedTask} activity={selectedActivity} description={description} clearAllFields={clearAllFields}/>
                    </Box>
                </div>
            </Container>

            <TimeLogTable/>
            <div style={{ height: "20px" }}></div>
            <TimeLogTable/>
        </div>
    );
}

export default App;
