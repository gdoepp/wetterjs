-- POSTGRESQL source
-- (c) Gerhard Döppert, 2017, GNU GPL 3



-- create vector average aggregates for wind speed/direction
-- the average is taken in 2D cartesian coordinates


CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

--
-- Name: arc_accum(double precision[], double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_accum(agg_state double precision[], el double precision[]) RETURNS double precision[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$ 
    begin 
	  	if (el[1] is not null and el[2] is not null) 
	  	then                                                                      
			agg_state[1] := agg_state[1]+el[1]*cos(3.14159*el[2]/180);
			agg_state[2] := agg_state[2]+el[1]*sin(3.14159*el[2]/180);
			agg_state[3] := agg_state[3]+1; 
		end if;
		return agg_state;
	end;
$$;

--
-- Name: arc_avg2_final(double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_avg2_final(agg_state double precision[]) RETURNS double precision[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare 
      t float8; 
      r float8; 
    begin
      if (agg_state[3]>0) 
      then 
        r := sqrt(agg_state[1]^2+agg_state[2]^2)/agg_state[3]; 
        t := 360+180*atan2(agg_state[2], agg_state[1])/3.14159; 
        return ARRAY[r, t - (360 * trunc(t/360))]; 
      else 
      	return ARRAY[0,0]; 
      end if;
	end;
$$;

--
-- Name: arc_avg_final(double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_avg_final(agg_state double precision[]) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE
    AS $$
	declare 
		t float8; 
	begin
  		t := 360+180*atan2(agg_state[2], agg_state[1])/3.14159; 
  		return t - (360 * trunc(t/360));
	end;
$$;


--
-- Name: arc_avg(double precision[]); Type: AGGREGATE; Schema: public; Owner: gd
--

CREATE AGGREGATE arc_avg(double precision[]) (
    SFUNC = arc_accum,
    STYPE = double precision[],
    INITCOND = '{0,0,0}',
    FINALFUNC = arc_avg_final
);

--
-- Name: arc_avg2(double precision[]); Type: AGGREGATE; Schema: public; Owner: gd
--

CREATE AGGREGATE arc_avg2(double precision[]) (
    SFUNC = arc_accum,
    STYPE = double precision[],
    INITCOND = '{0,0,0}',
    FINALFUNC = arc_avg2_final
);

-- Tables:

CREATE SCHEMA wetter_retro;

--
-- Name: data; Type: TABLE; Schema: wetter_retro; Partitioned
--

CREATE TABLE wetter_retro.data (
    stat integer NOT NULL,
    mtime timestamp with time zone NOT NULL,
    pres numeric(6,1),
    temp_o numeric(6,1),
    hum_o numeric(6,1),
    precip numeric(6,1),
    cloud numeric(4,1),
    temp_i numeric(6,1),
    windf numeric(4,1),
    windd integer,
    sun numeric(5,0),
    primary key(stat,mtime)
);

--
-- Name: data_dwdhist; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_dwdhist (
    CONSTRAINT data_dwdhist_check CHECK (((mtime < '2016-01-01'::date) AND (stat > 0)))
)
INHERITS (data);

--
-- Name: data_dwdrecent; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_dwdrecent (
    CONSTRAINT data_dwdrecent_check CHECK (((mtime >= '2016-01-01'::date) AND (stat > 0)))
)
INHERITS (data);

--
-- Name: data_homerecent; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_homerecent (
    CONSTRAINT data_homerecent_check CHECK (((mtime >= '2016-01-01'::date) AND (stat = 0)))
)
INHERITS (data);


--
-- Name: data_insert_trigger(); Type: FUNCTION; Schema: wetter_retro;
--

CREATE FUNCTION wetter_retro.data_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
 BEGIN
	IF (NEW.stat>0 and NEW.mtime>='2016-01-01') then INSERT INTO wetter_retro.data_dwdrecent Values(NEW.*);
	ELSIF (NEW.stat>0) then INSERT INTO wetter_retro.data_dwdhist Values(NEW.*);
	ELSE INSERT INTO wetter_retro.data_homerecent Values(NEW.*);
	END IF;
	return NULL;
END;
$$;


CREATE INDEX  ON wetter_retro.data_dwdhist USING btree (stat, mtime);


CREATE INDEX  ON wetter_retro.data_dwdrecent USING btree (stat, mtime);


CREATE INDEX  ON wetter_retro.data_homerecent USING btree (stat, mtime);


--
-- Name: wetter_retro_insert_data_trigger; Type: TRIGGER; Schema: wetter_retro; 
--

CREATE TRIGGER wetter_retro_insert_data_trigger BEFORE INSERT ON wetter_retro.data FOR EACH ROW EXECUTE PROCEDURE wetter_retro.data_insert_trigger();

-- shortcut for performance reasons, to be refreshed on insert of old data
CREATE MATERIALIZED VIEW wetter_retro.stats AS
 SELECT stat,
    date_trunc('year'::text, min(data.mtime)) AS year
   FROM wetter_retro.data
  GROUP BY stat;

